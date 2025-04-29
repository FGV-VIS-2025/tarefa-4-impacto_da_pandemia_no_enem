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
        d3.csv("./data/enem2020-mg.csv")
  ]).then(([data2019, data2020]) => {

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

        array = [...new Set(filteredData2019.map(d => d[column]))];

        const subscriptions = [
                        {year: "2019", total: filteredData2019.length},
                        {year: "2020", total: filteredData2020.length}
                        ];

        for (let index = 0; index < array.length; index++) {
            subscriptions[0][column + String(index)] = filteredData2019.filter(d => d[column] === array[index]).length;
            subscriptions[1][column + String(index)] = filteredData2020.filter(d => d[column] === array[index]).length;
        }

        // Se há uma categoria filtrada, remove todas as outras
        if (filteredCategory) {
            array.splice(0, array.length, filteredCategory);
        }

        // Atualiza a escala do eixo Y
        y.domain([0, d3.max(subscriptions, d => d3.max(array.map(category => d[column + String(array.indexOf(category))] || 0)))]).nice();

        // Atualiza o eixo Y
        svg.selectAll(".y-axis").remove();
        svg.append("g")
            .attr("class", "y-axis")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y));

        // Atualiza o eixo X
        svg.selectAll(".x-axis").remove();
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x));

        // Adiciona a escala secundária para os subgrupos
        const xSubgroup = d3.scaleBand()
            .domain(array)
            .range([0, x.bandwidth()])
            .padding(0.05);

        // Junta os dados organizados para cada ano e categoria
        const barGroups = barsGroup.selectAll(".chart-container")
            .data(subscriptions)
            .join("g")
            .attr("class", "chart-container")
            .attr("transform", d => `translate(${x(d.year)}, 0)`);

        // Adiciona barras dentro dos grupos
        barGroups.selectAll("rect")
            .data(d => array.map(category => ({
                key: category,
                value: d[column + String(array.indexOf(category))] || 0
            })))
            .join("rect")
            .attr("x", d => xSubgroup(d.key))
            .attr("y", d => y(d.value))
            .attr("width", xSubgroup.bandwidth())
            .attr("height", d => y(0) - y(d.value))
            .attr("fill", (d, i) => colorScale[i % 10])
            .on("mouseover", function (event, d) {
                d3.select(this) 
                .transition()
                .duration(200)
                .attr("stroke", "black")
            })
            .on("mouseout", function (event, d) {
                d3.select(this) 
                    .transition()
                    .duration(200)
                    .attr("stroke", "none")
            })
            .on("click", function (event, d){
                barCharts(region, column, array);
            });

        // Remove barras excedentes, se existirem
        barGroups.exit().remove();

        createLegend(colorScale);
    }

    function createLegend(colorScale) {
        // Adiciona a legenda ao gráfico
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width - margin.right - 100},${margin.top})`);
        
        if (array.length === 1) {
            svg.selectAll(".legend").remove();
        }
        else {
            array.forEach((category, i) => {
                const legendGroup = legend.append("g")
                    .attr("class", "legend-item") // Classe para cada item da legenda
                    .attr("transform", `translate(0, ${i * 20})`);

                legendGroup.append("rect")
                    .attr("class", "legend-rect") // Classe para os retângulos
                    .attr("width", 15)
                    .attr("height", 15)
                    .attr("fill", colorScale[i % 10]);
                
                    legendGroup.append("text")
                        .attr("class", "legend-text") // Classe para os textos
                        .attr("x", 20)
                        .attr("y", 12)
                        .text(category)
                        .style("font-size", "12px")
                        .attr("fill", "black");
                // Vincula os dados às legendas
                legendGroup.datum(category);
            });
        }
        legend.selectAll(".legend-item")
            .on("click", function(event, d) {
                console.log(`Categoria clicada: ${d}`);
                barCharts("all", "TP_COR_RACA", d);
            });
    }

    barCharts("all"); 

    d3.select("#select-button").on("change", () => {
        const category = document.getElementById("select-button").value;
        barCharts("all", category); 
    });

    // Configuração do botão "Remover Filtros"
    d3.select("#reset-button").on("click", () => {
        const category = document.getElementById("select-button").selectedIndex = 0;
        barCharts("all", category);
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
            });
    });

});
