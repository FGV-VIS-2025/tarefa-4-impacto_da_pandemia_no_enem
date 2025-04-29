/* ALTERAÇÃO PARA OUTROS TEMAS */

const themeSelect = document.getElementById('theme-select');

const LOOKUP = {
    TP_SEXO: {
        M: "Masculino",
        F: "Feminino"
    },
    TP_COR_RACA: {
        0: "Não declarado",
        1: "Branca",
        2: "Preta",
        3: "Parda",
        4: "Amarela",
        5: "Indígena",
        6: "Não dispõe da informação"
    },
    TP_ESCOLA: {
        1: "Não respondeu",
        2: "Pública", 
        3: "Privada"
    },
    TP_ESTADO_CIVIL: {
        0: "Não informado", 
        1: "Solteiro(a)",
        2: "Casado(a)",
        3: "Divorciado(a)",
        4: "Viúvo(a)",
    },
    TP_FAIXA_ETARIA: {
        1: "Menor de 17 anos",
        2: "17 anos",
        3: "18 anos",
        4: "19 anos",
        5: "20 anos",
        6: "21 anos",
        7: "22 anos",
        8: "23 anos",
        9: "24 anos",
        10: "25 anos",
        11: "Entre 26 e 30 anos",
        12: "Entre 31 e 35 anos",
        13: "Entre 36 e 40 anos",
        14: "Entre 41 e 45 anos",
        15: "Entre 46 e 50 anos",
        16: "Entre 51 e 55 anos",
        17: "Entre 56 e 60 anos",
        18: "Entre 61 e 65 anos",
        19: "Entre 66 e 70 anos",
        20: "Maior de 70 anos"
    },
    TP_LOCALIZACAO_ESC: {
        1: "Urbana",
        2: "Rural"
    }
}

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

window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("variable1").selectedIndex = 0;
    document.getElementById("variable2").selectedIndex = 0;
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

    // Atualiza o gráfico com base na região selecionada
    function updateCharts(region) {
        // Filtra os dados conforme a região
        const filteredData2019 = (region === "all") ? data2019 : data2019.filter(d => d.MESORREGIAO === region);
        const filteredData2020 = (region === "all") ? data2020 : data2020.filter(d => d.MESORREGIAO === region);

        // Recalcula as contagens e a distribuição por sexo
        const inscricoes = [
        { 
            ano: "2019", 
            total: filteredData2019.length, 
            M: filteredData2019.filter(d => d.TP_SEXO === 'M').length,
            F: filteredData2019.filter(d => d.TP_SEXO === 'F').length
        },
        { 
            ano: "2020", 
            total: filteredData2020.length, 
            M: filteredData2020.filter(d => d.TP_SEXO === 'M').length,
            F: filteredData2020.filter(d => d.TP_SEXO === 'F').length
        }
        ];

        // Atualiza a escala do eixo Y com base no máximo dos totais
        y.domain([0, d3.max(inscricoes, d => d.total)]).nice();

        // Atualiza o eixo Y
        svg.selectAll(".y-axis").remove();
        svg.append("g")
            .attr("class", "y-axis")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y));

        // Atualiza o eixo X caso necessário
        svg.selectAll(".x-axis").remove();
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x));

        // Junta os dados e atualiza as barras
        const bars = barsGroup.selectAll(".bar")
            .data(inscricoes);

        // Atualiza barras já existentes
        bars.transition().duration(500)
            .attr("y", d => y(d.total))
            .attr("height", d => y(0) - y(d.total));

        // Insere novas barras
        bars.enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.ano))
            .attr("width", x.bandwidth())
            .attr("y", y(0))
            .attr("height", 0)
            .attr("fill", "#69b3a2")
            .on("mouseover", (event, d) => {
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(
                `<strong>${d.ano}</strong><br/>` +
                `Total: ${d.total}<br/>` +
                `Masculino: ${d.M}<br/>` +
                `Feminino: ${d.F}`
                )
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 28}px`);
            })
            .on("mouseout", () => {
                tooltip.transition().duration(300).style("opacity", 0);
            })
            .transition().duration(500)
            .attr("y", d => y(d.total))
            .attr("height", d => y(0) - y(d.total));

        // Remove barras excedentes, se existirem
        bars.exit().remove();
    }

    function updateColorbar(colorscale) {
        const container = d3.select("#colorbar");
        container.selectAll("*").remove();

        const margin = {left: 30, right: 30, top: 10, bottom: 20};  
        const width = 400
        const height = 20;

        const svg = container.append("svg")
            .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .attr("preserveAspectRatio", "xMidYMid meet")

            const defs = svg.append("defs")
            const grads = defs.append("linearGradient")
                .attr("id", "legend-gradient")
                .attr("x1", "0%").attr("y1", "0%")
                .attr("x2", "100%").attr("y2", "0%");

        const n = 10;
        const [minVal, maxVal] = colorscale.domain();
        const stops = d3.range(n).map(i => minVal + (maxVal - minVal) * i / (n - 1));

        grads.selectAll("stop")
            .data(stops)
            .enter()
            .append("stop")
                .attr("offset", (d, i) => `${100*i/(n-1)}%`)
                .attr("stop-color", d => colorscale(d));

        svg.append("rect")
            .attr("x", margin.left)
            .attr("y", margin.top)
            .attr("width", width)
            .attr("height", height)
            .style("fill", "url(#legend-gradient)");

        const legendScale = d3.scaleLinear()
            .domain(colorscale.domain())
            .range([0, width]);

        const axis = d3.axisBottom(legendScale)
            .ticks(5)
            .tickFormat(d3.format("~s"));

        svg.append("g")
            .attr("transform", `translate(${margin.left},${height + margin.top})`)
            .call(axis);
    }

    function updateHeatMap(region, year) {
        // Filtra os dados conforme a região
        let filteredDataYear;
        if (year === 2019) {
            filteredDataYear = data2019;
        } else if (year === 2020) {
            filteredDataYear = data2020;
            console.log("oi");
        } else {
            console.error("Ano inválido. Use 2019 ou 2020.");
        }

        const filteredData = (region === "all") ? filteredDataYear : filteredDataYear.filter(d => d.MESORREGIAO === region);

        // Obtém por meio do select do HTML as variáveis dos eixos
        let selected1 = document.getElementById("variable1").value;
        let selected2 = document.getElementById("variable2").value;

        // Definição de proporções
        const marginHeatmap = { top: 20, right: 50, bottom: 100, left: 100 };
        const heatmapContainer = d3.select("#heatmap-container");

        const fullWidth = 500;
        const fullHeight = 500;

        const width = fullWidth - marginHeatmap.left - marginHeatmap.right;
        const height = fullHeight - marginHeatmap.top - marginHeatmap.bottom;

        // Contagem das combinações de variáveis
        const counts = {};
        filteredData.forEach(d => {
            const variable1 = d[selected1];
            const variable2 = d[selected2];
            const key = `${variable1}-${variable2}`
            counts[key] = (counts[key] || 0) + 1;
        });
        
        const cats1 = [...new Set(filteredData.map(d => d[selected1]))];
        const cats2 = [...new Set(filteredData.map(d => d[selected2]))];

        const map1 = LOOKUP[selected1] || (d=>d);
        const map2 = LOOKUP[selected2] || (d=>d);

        const fullGrid = [];
        cats1.forEach(v1 => {
            cats2.forEach(v2 => {
                const key = `${v1}-${v2}`;
                fullGrid.push({
                    v1,
                    v2,
                    value: counts[key] || 0
                });
            });
        });

        //  Desenvolvimento do gráfico
        const x = d3.scaleBand()
            .domain(cats1)
            .range([0, width])
            .padding(0.05);

        const y = d3.scaleBand()
            .domain(cats2)
            .range([height, 0])
            .padding(0.05);

        const color = d3.scaleSequential()
            .interpolator(d3.interpolateBlues)
            .domain([0, d3.max(Object.values(counts))]);

        let svgHeatmap;
        if (year === 2019) {    
            svgHeatmap = d3.select("#heatmap2019")
                .attr("width", fullWidth)
                .attr("height", fullHeight);
        }
        else if (year === 2020) {
            svgHeatmap = d3.select("#heatmap2020")
                .attr("width", fullWidth)
                .attr("height", fullHeight);
        }

        svgHeatmap.selectAll("*").remove();
        // Atualiza o eixo Y
        const g = svgHeatmap.append("g")
            .attr("transform", `translate(${marginHeatmap.left},${marginHeatmap.top})`);

        g.selectAll("rect")
            .data(fullGrid, d => d.v1 + "-" + d.v2)
            .enter()
            .append("rect")
                .attr("x", d => x(d.v1))
                .attr("y", d => y(d.v2))
                .attr("width", x.bandwidth() - 1)
                .attr("height", y.bandwidth() - 1)
                .attr("fill", d => color(d.value))
                .on("mouseover", (event, d) => {
                    const label1 = map1[d.v1] ||  d.v1;
                    const label2 = map2[d.v2] ||  d.v2;

                    tooltip.style("opacity", 1).html(`<strong>${label1}</strong> × <strong>${label2 }</strong><br/><em>${d.value}</em> participante(s)`);
                })
                .on("mousemove", (event, d) => {
                    tooltip.style("left", `${event.pageX + 10}px`).style("top", `${event.pageY - 25}px`);
                })
                .on("mouseout", () => {
                    tooltip.style("opacity", 0);
                })

        
        // Adiciona os rótulos de texto
        const xAxis = d3.axisBottom(x).tickFormat(code => map1[code] ?? code);
        const yAxis = d3.axisLeft(y).tickFormat(code => map2[code] ?? code);

        const selectedText1 = document.getElementById("variable1").options[document.getElementById("variable1").selectedIndex].text;
        const selectedText2 = document.getElementById("variable2").options[document.getElementById("variable2").selectedIndex].text;
 
        g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis)
            .selectAll("text")
                .attr("transform", "rotate(-45)")
                .attr("dx", "-0.6em")
                .attr("dy", "0.25em")
                .style("text-anchor", "end");

        g.append("g")
            .attr("class", "y-axis")
            .call(yAxis)
            .selectAll("text")
                .attr("dx", "-0.6em")
                .style("text-anchor", "end");
                
        g.append("text")
            .attr("class","axis-label")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .attr("text-anchor", "middle")
            .text(selectedText1);

        g.append("text")
            .attr("class","axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 20)
            .attr("text-anchor", "middle")
            .text(selectedText2);

        updateColorbar(color);

    }

    let currentRegion = "all";

    updateCharts("all");
    updateHeatMap("all", 2019);
    updateHeatMap("all", 2020);

    // Configuração do botão "Reset Filter" – este botão é livre e posicionado conforme o CSS
    d3.select("#reset-button").on("click", () => {
        updateCharts("all");
        updateHeatMap("all", 2019);
        updateHeatMap("all", 2020);
        svgMap.selectAll("path").classed("selected", false).attr("fill", "#69b3a2");
        document.getElementById("variable1").selectedIndex = 0;
        document.getElementById("variable2").selectedIndex = 0;
    });
    
    d3.select("#reset-button").style("display", "block");

    d3.select("#variable1").on("change", () => {
        updateHeatMap(currentRegion, 2019); 
        updateHeatMap(currentRegion, 2020);
    });
    d3.select("#variable2").on("change", () => {
        updateHeatMap(currentRegion, 2019); 
        updateHeatMap(currentRegion, 2020);
    });

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
                updateCharts(filteredRegion);
                updateHeatMap(filteredRegion, 2019);
                updateHeatMap(filteredRegion, 2020);
            });
    });

});
  
  
