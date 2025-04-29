/* ALTERAÇÃO PARA OUTROS TEMAS */

const themeSelect = document.getElementById('theme-select');

function applyTheme(theme) {
    const root = document.documentElement;
    root.classList.remove('dark-mode');

    if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        root.classList.add('dark-mode');
    }

    localStorage.setItem('theme', theme);
}

// Quando o usuário muda a seleção
themeSelect.addEventListener('change', () => {
    applyTheme(themeSelect.value);
});

// Define o tema inicial ao carregar a página
window.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('theme') || 'auto';
    themeSelect.value = saved;
    applyTheme(saved);
});

// Se o usuário está no modo automático e o sistema muda de cor
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const current = localStorage.getItem('theme');
    if (current === 'auto') {
        applyTheme('auto');
    }
});

/* GRÁFICOS INTERATIVOS */

// Carreaga os arquivos CSV de 2019 e 2020
Promise.all([
        d3.csv("./data/enem2019-mg.csv"),
        d3.csv("./data/enem2020-mg.csv"),
        d3.csv("./data/enem2019-mg-grouped.csv"),
        d3.csv("./data/enem2020-mg-grouped.csv")
  ]).then(([data2019, data2020, data2019Grouped, data2020Grouped]) => {

    // Para o box plot
    const containerBox = d3.select("#boxplot-container");
    const widthBox = containerBox.node().getBoundingClientRect().width;
    const heightBox = 400;

    const svgBox = containerBox
        .append("svg")
        .attr("viewBox", `0 0 ${widthBox} ${heightBox}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    // Para o gráfico de barras
    const container = d3.select("#chart-container");
    const width = container.node().getBoundingClientRect().width;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  
    const svg = container
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");
  
    const x = d3.scaleBand()
        .domain(["2019", "2020"])
        .range([margin.left, width - margin.right])
        .padding(0.4);
  
    const y = d3.scaleLinear()
        .range([height - margin.bottom, margin.top]);

    const yBox = d3.scaleLinear()
        .range([heightBox - margin.top, margin.bottom]);    
  
    const barsGroup = svg.append("g")
        .attr("class", "bars");

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip");

    let array;
    // Atualiza o gráfico com base na região selecionada
    function barCharts(region, column, filteredCategory) {
        let colorScale = d3.schemeCategory10;
        svg.selectAll(".legend").remove();
        
        // Filtra os dados conforme a região
        const filteredData2019 = (region === "all") ? data2019 : data2019.filter(d => d.MESORREGIAO === region);
        const filteredData2020 = (region === "all") ? data2020 : data2020.filter(d => d.MESORREGIAO === region);
    
        // Obtém TODAS as categorias possíveis (não apenas as filtradas)
        const allCategories = [...new Set(data2019.map(d => d[column]))];
        
        // Define as categorias que serão exibidas
        const displayCategories = filteredCategory ? [filteredCategory] : allCategories;
    
        const subscriptions = [
            {year: "2019", total: filteredData2019.length},
            {year: "2020", total: filteredData2020.length}
        ];
    
        // Mapeia todas as categorias possíveis
        allCategories.forEach((category, index) => {
            subscriptions[0][column + index] = filteredData2019.filter(d => d[column] === category).length;
            subscriptions[1][column + index] = filteredData2020.filter(d => d[column] === category).length;
        });
    
        // Atualiza a escala do eixo Y com base nas categorias exibidas
        const maxValue = d3.max(subscriptions, d => 
            d3.max(displayCategories.map(category => {
                const index = allCategories.indexOf(category);
                return d[column + index] || 0;
            }))
        );
        y.domain([0, maxValue]).nice();
    
        // Atualiza os eixos
        svg.selectAll(".y-axis").remove();
        svg.append("g")
            .attr("class", "y-axis")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y));
    
        svg.selectAll(".x-axis").remove();
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x));
    
        // Escala para subgrupos - usa displayCategories
        const xSubgroup = d3.scaleBand()
            .domain(displayCategories)
            .range([0, x.bandwidth()])
            .padding(0.05);
    
        // Atualiza as barras
        const barGroups = barsGroup.selectAll(".chart-container")
            .data(subscriptions)
            .join("g")
            .attr("class", "chart-container")
            .attr("transform", d => `translate(${x(d.year)}, 0)`);
    
        barGroups.selectAll("rect")
            .data(d => displayCategories.map(category => {
                const index = allCategories.indexOf(category);
                return {
                    key: category,
                    value: d[column + index] || 0,
                    year: d.year
                };
            }))
            .join("rect")
            .attr("x", d => xSubgroup(d.key))
            .attr("y", d => y(d.value))
            .attr("width", xSubgroup.bandwidth())
            .attr("height", d => y(0) - y(d.value))
            .attr("fill", (d, i) => colorScale[allCategories.indexOf(d.key) % 10])
            .on("mouseover", function(event, d) {
                d3.select(this).transition().duration(200).attr("stroke", "black");
            })
            .on("mouseout", function(event, d) {
                d3.select(this).transition().duration(200).attr("stroke", "none");
            })
            .on("click", function(event, d) {
                // Alterna o filtro: se já está filtrado, mostra tudo; senão, filtra
                barCharts(region, column, filteredCategory === d.key ? null : d.key);
            });
    
        if (column && column !== "all"){
            createLegend(colorScale, column, region, allCategories, filteredCategory);
        }

        const title = d3.select("#barchart-title");
        if (region === "all") {
            title.text(" Quantidade de Participantes do ENEM em Minas Gerais")
        }
        else {
            title.text(" Quantidade de Participantes do ENEM na região " + region.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()))
        }    
    }
    
    function createLegend(colorScale, column, region, allCategories, currentFilter) {
        svg.selectAll(".legend").remove();
        
        // Se está filtrado, não mostra legenda (ou mostra apenas o item filtrado)
        if (currentFilter) return;
        
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width - margin.right - 100},${margin.top})`);
    
        allCategories.forEach((category, i) => {
            const legendGroup = legend.append("g")
                .attr("class", "legend-item")
                .attr("transform", `translate(0, ${i * 20})`)
                .style("cursor", "pointer");
    
            legendGroup.append("rect")
                .attr("width", 15)
                .attr("height", 15)
                .attr("fill", colorScale[i % 10]);
    
            legendGroup.append("text")
                .attr("x", 20)
                .attr("y", 12)
                .text(category)
                .style("font-size", "12px")
                .attr("fill", "black");
    
            legendGroup.on("click", function() {
                barCharts(region, column, category);
            });
        });
    }

    function boxPlot(region) {
        // Primeiro limpa o SVG para redesenhar
        svgBox.selectAll("*").remove();

        // Filtra os dados conforme a região
        const filteredData2019 = (region === "all") ? data2019Grouped : data2019Grouped.filter(d => d.MESORREGIAO === region);
        const filteredData2020 = (region === "all") ? data2020Grouped : data2020Grouped.filter(d => d.MESORREGIAO === region);
    
        // Extrai os valores de presença como números
        const presenca2019 = filteredData2019.map(d => +d.PRESENCA);
        const presenca2020 = filteredData2020.map(d => +d.PRESENCA);
    
        // Função auxiliar para calcular os quartis
        function quartiles(arr) {
            arr.sort(d3.ascending);
            return {
                q0: d3.quantile(arr, 0.025),
                q1: d3.quantile(arr, 0.25),
                median: d3.quantile(arr, 0.5),
                q3: d3.quantile(arr, 0.75),
                q4: d3.quantile(arr, 0.975),
                min: d3.min(arr),
                max: d3.max(arr)
            };
        }
    
        const stats2019 = quartiles(presenca2019);
        const stats2020 = quartiles(presenca2020);
    
        // Limpa o SVG antes de redesenhar
        svgBox.selectAll("*").remove();
    
        // Configuração das escalas
        const xBox = d3.scaleBand()
            .domain(["2019", "2020"])
            .range([margin.left, widthBox - margin.right])
            .padding(0.4);
    
        yBox.domain([0, 1])
           .range([heightBox - margin.bottom, margin.top]);
    
        // Desenha os eixos
        svgBox.append("g")
            .attr("class", "y-axis")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(yBox));
    
        svgBox.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${heightBox - margin.bottom})`)
            .call(d3.axisBottom(xBox));
    
        // Configurações visuais
        const boxWidth = xBox.bandwidth() * 0.6;
        const boxplotGroup = svgBox.append("g");

        // Tooltip (criado uma vez fora do loop)
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute");
        
        // Desenha os boxplots para cada ano
        ["2019", "2020"].forEach((year, i) => {
            const stats = i === 0 ? stats2019 : stats2020;
            const xPos = xBox(year) + xBox.bandwidth() / 2;
            const filteredData = i === 0 ? filteredData2019 : filteredData2020;

            // Caixa principal (do Q1 ao Q3)
            boxplotGroup.append("rect")
                .attr("class", "box")
                .attr("x", xPos - boxWidth/2)
                .attr("y", yBox(stats.q3))
                .attr("width", boxWidth)
                .attr("height", yBox(stats.q1) - yBox(stats.q3))
                .attr("stroke", "black")
                .attr("fill", "#69b3a2");

            // Linha da mediana COM tooltip
            boxplotGroup.append("line")
                .attr("class", "median")
                .attr("x1", xPos - boxWidth/2)
                .attr("x2", xPos + boxWidth/2)
                .attr("y1", yBox(stats.median))
                .attr("y2", yBox(stats.median))
                .attr("stroke", "black")
                .attr("stroke-width", 2)
                .on("mouseover", function(event) {
                    tooltip.transition().duration(200).style("opacity", 1);
                    tooltip.html(`Ano: ${year}
                        <br>Mediana: ${stats.median.toFixed(3)}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function() {
                    tooltip.transition().duration(500).style("opacity", 0);
                });

            // Bigodes e linhas horizontais (mantidos iguais)
            boxplotGroup.append("line")
                .attr("class", "q0-q1")
                .attr("x1", xPos)
                .attr("x2", xPos)
                .attr("y1", yBox(stats.q0))
                .attr("y2", yBox(stats.q1))
                .attr("stroke", "black");

            boxplotGroup.append("line")
                .attr("class", "q3-q4")
                .attr("x1", xPos)
                .attr("x2", xPos)
                .attr("y1", yBox(stats.q3))
                .attr("y2", yBox(stats.q4))
                .attr("stroke", "black");

            boxplotGroup.append("line")
                .attr("class", "q0-q0")
                .attr("x1", xPos - boxWidth/3)
                .attr("x2", xPos + boxWidth/3)
                .attr("y1", yBox(stats.q0))
                .attr("y2", yBox(stats.q0))
                .attr("stroke", "black");

            boxplotGroup.append("line")
                .attr("class", "q4-q4")
                .attr("x1", xPos - boxWidth/3)
                .attr("x2", xPos + boxWidth/3)
                .attr("y1", yBox(stats.q4))
                .attr("y2", yBox(stats.q4))
                .attr("stroke", "black");

            // Extrai outliers com dados completos (incluindo MESORREGIAO)
            const outlierData = filteredData.filter(d => {
                const value = +d.PRESENCA;
                return value < stats.q0 || value > stats.q4;
            });

            // Desenha outliers com tooltip
            outlierData.forEach(d => {
                boxplotGroup.append("circle")
                    .attr("class", "outlier-point")
                    .attr("cx", xPos)
                    .attr("cy", yBox(+d.PRESENCA))
                    .attr("r", 5)
                    .attr("fill", "black")
                    .attr("stroke", "black")
                    .on("mouseover", function(event) {
                        tooltip.transition().duration(200).style("opacity", 0.9);
                        tooltip.html(`Ano: ${year}
                            <br>Mesorregião: ${d.MESORREGIAO}
                            <br>Cidade: ${d.NO_MUNICIPIO_ESC}
                            <br>Taxa: ${(+d.PRESENCA).toFixed(3)}`)
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mouseout", function() {
                        tooltip.transition().duration(500).style("opacity", 0);
                    });
            });
        });
    
        // Adiciona rótulos aos eixos (centralizados)
        svgBox.append("text")
            .attr("class", "y-label")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("x", -heightBox / 2)
            .attr("y", margin.left / 2 - 10)
            .text("Taxa de Presença");

        svgBox.append("text")
            .attr("class", "x-label")
            .attr("text-anchor", "middle")
            .attr("x", widthBox / 2)
            .attr("y", heightBox - 6)
            .text("Ano");

        // Para alterar o título
        const title = d3.select("#boxplot-title");
        if (region === "all") {
            title.text("Distribuição da Média de Presença por Cidade em Minas Gerais")
        }
        else {
            title.text("Distribuição da Média de Presença por Cidade para a região " + region.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()))
        }    
    }
    
    barCharts("all"); 
    boxPlot("all");

    d3.select("#select-button").on("change", () => {
        const category = document.getElementById("select-button").value;
        barCharts("all", category); 
    });

    // Configuração do botão "Remover Filtros"
    d3.select("#reset-button").on("click", () => {
        const category = document.getElementById("select-button").selectedIndex = 0;
        barCharts("all", category);
        boxPlot("all");
        svgMap.selectAll("path").classed("selected", false).attr("fill", "#69b3a2");
    });
    
    d3.select("#reset-button").style("display", "block");

    const containerMap = d3.select("#map-container")
    const widthMap = 800;
    const heightMap = 600;

    // Cria o SVG para o mapa
    const svgMap = containerMap
        .append("svg")
        .attr("viewBox", `0 0 ${widthMap} ${heightMap}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    // Configura a projeção e o gerador de caminho
    const projection = d3.geoMercator()
        .scale(3500)
        .center([-45.5, -18.5]) 
        .translate([widthMap / 2, heightMap / 2]);

    const path = d3.geoPath().projection(projection);

    // Carrega os dados GeoJSON
    d3.json("./GeoJSON/regioes_minas.json").then(geojson => {
        svgMap.selectAll("path")
            .data(geojson.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", "#69b3a2")
            .attr("stroke", "#333")
            .on("mouseover", function (event, d) {
                d3.select(this).attr("fill", "green");
                tooltip.transition().style("opacity", 1);
                tooltip.html(`<strong>${d.properties.nm_meso}</strong>`)
                    .style("left", `${event.pageX + 5}px`)
                    .style("top", `${event.pageY - 5}px`);
            })
            .on("mouseout", function (event, d) {
                if (!d3.select(this).classed("selected")) {
                    d3.select(this).attr("fill", "#69b3a2");
                }
                else {d3.select(this).attr("fill", "darkgreen");}
                tooltip.transition().style("opacity", 0);
            })
            .on("click", function (event, d){
                svgMap.selectAll("path")
                    .classed("selected", false)
                    .attr("fill", "#69b3a2");

                d3.select(this)
                    .classed("selected", true)
                    .attr("fill", "darkgreen");

                const filteredRegion = d.properties.nm_meso;
                
                const category = document.getElementById("select-button").value;
                barCharts(filteredRegion, category);
                boxPlot(filteredRegion);
            });
    });
});
