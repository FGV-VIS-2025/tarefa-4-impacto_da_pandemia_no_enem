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

    updateCharts("all");

    // Configuração do botão "Reset Filter" – este botão é livre e posicionado conforme o CSS
    d3.select("#reset-button").on("click", () => {
        updateCharts("all");
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
            });
    });

});
  
  
