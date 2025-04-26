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



/* GRÁFICO DE BARRAS INTERATIVO */

// Carreaga os arquivos CSV de 2019 e 2020
Promise.all([
        d3.csv("./data/enem2019-mg.csv"),
        d3.csv("./data/enem2020-mg.csv")
  ]).then(([data2019, data2020]) => {
    // Aarray com dicionários para cada ano
    const inscricoes = [
        { ano: "2019", total: data2019.length, M: 0, F: 0 },
        { ano: "2020", total: data2020.length, M: 0, F: 0 }
    ];
    
    // Contagem dos sexos
    data2019.forEach(d => {
        if (d.TP_SEXO === 'M') inscricoes[0].M++;
        else if (d.TP_SEXO === 'F') inscricoes[0].F++;
    });
  
    data2020.forEach(d => {
        if (d.TP_SEXO === 'M') inscricoes[1].M++;
        else if (d.TP_SEXO === 'F') inscricoes[1].F++;
    });
  
    const container = d3.select("#chart-container");
    const width = container.node().getBoundingClientRect().width;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  
    const svg = container
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");
  
    const x = d3.scaleBand()
        .domain(inscricoes.map(d => d.ano))
        .range([margin.left, width - margin.right])
        .padding(0.4);
  
    const y = d3.scaleLinear()
        .domain([0, d3.max(inscricoes, d => d.total)]).nice()
        .range([height - margin.bottom, margin.top]);
  
    // Cria uma div para o tooltip  
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip");

    // Eixo X  
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x));
    
    // Eixo Y  
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));
    
    // Barras  
    svg.selectAll(".bar")
      .data(inscricoes)
      .join("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.ano))
      .attr("y", d => y(d.total))
      .attr("width", x.bandwidth())
      .attr("height", d => y(0) - y(d.total))
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
      });

    
    // Criação de um gráfico de mapa para Minas Gerais
    const containerMap = d3.select("#map-container")
    const widthMap = container.node().getBoundingClientRect().width + 10;
    const heightMap = 600;

    // Criar o SVG para o mapa
    const svgMap = containerMap
        .append("svg")
        .attr("viewBox", `0 0 ${widthMap} ${heightMap}`)
        .attr("preserveAspectRatio", "xMidYMid meet");
    // Configurar a projeção e o gerador de caminho
    const projection = d3.geoMercator()
        .scale(3500)
        .center([-45, -18.5]) 
        .translate([widthMap / 2, heightMap / 2]);

    const path = d3.geoPath().projection(projection);

    // Carregar os dados GeoJSON
    d3.json("./GeoJSON/regioes_minas.json").then(geojson => {
        svgMap.selectAll("path")
            .data(geojson.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", "#69b3a2")
            .attr("stroke", "#333")
            .on("mouseover", function (event, d) {
                d3.select(this).attr("fill", "#ffcc00");
            })
            .on("mouseout", function (event, d) {
                d3.select(this).attr("fill", "#69b3a2"); 
            });
        });

  });
  
  
