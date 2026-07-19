const postos = [
  "Pino 1",
  "UBS Esq. Tras.",
  "Cadeira Esq. Frente",
  "Aplicacao Meio",
  "Cadeira Dir. Frente",
  "Mascara Direito",
  "UBS Dir. Tras.",
  "Pino 2",
  "UBS Dir. Frente",
  "Aplicacao Esq.",
  "Cadeira Esq. Tras.",
  "Aplicacao Dir.",
  "Cadeira Dir. Tras.",
  "Mascara Esq.",
  "UBS Meio",
  "Pino 7L",
  "UBS Frente Esq."
];

const dias = ["SEG", "TER", "QUA", "QUI", "SEX"];
const tarefas5S = [
  "Organizacao UBS",
  "Recolher panos 7h",
  "Recolher panos UBS",
  "Limpeza dos tubetes"
];

const storageKeys = {
  escala: "rotatividadeEscala",
  tarefas: "rotatividadeTarefas5S",
  semana: "rotatividadeSemana",
  ultimaGeracao: "ultimaSemana"
};

function embaralhar(lista) {
  const arr = [...lista];

  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

function escaparHTML(valor) {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function obterNomes() {
  return document
    .getElementById("nomes")
    .value
    .split("\n")
    .map((nome) => nome.trim())
    .filter(Boolean);
}

function criarEscala(nomes) {
  const ordemDaSemana = embaralhar(postos);

  return nomes.map((nome, index) => {
    const inicio = index % ordemDaSemana.length;
    const rotacao = dias.map((_, diaIndex) => {
      const posicao = (inicio + diaIndex) % ordemDaSemana.length;
      return ordemDaSemana[posicao];
    });

    return { nome, rotacao };
  });
}

function criarTarefas5S(nomes) {
  const nomesSorteados = embaralhar(nomes);

  return tarefas5S.map((tarefa, index) => ({
    tarefa,
    nome: nomesSorteados[index % nomesSorteados.length] || ""
  }));
}

function obterChaveSemana(data = new Date()) {
  const inicioSemana = new Date(data);
  const dia = inicioSemana.getDay();
  const diferenca = dia === 0 ? -6 : 1 - dia;

  inicioSemana.setDate(inicioSemana.getDate() + diferenca);
  inicioSemana.setHours(0, 0, 0, 0);

  return inicioSemana.toISOString().slice(0, 10);
}

function salvarEscala(escala, tarefas) {
  localStorage.setItem(storageKeys.escala, JSON.stringify(escala));
  localStorage.setItem(storageKeys.tarefas, JSON.stringify(tarefas));
  localStorage.setItem(storageKeys.semana, obterChaveSemana());
  localStorage.setItem(storageKeys.ultimaGeracao, new Date().toISOString());
}

function carregarDadosDaSemana() {
  const semanaSalva = localStorage.getItem(storageKeys.semana);

  if (semanaSalva !== obterChaveSemana()) {
    return null;
  }

  try {
    const escala = JSON.parse(localStorage.getItem(storageKeys.escala) || "null");
    const tarefas = JSON.parse(localStorage.getItem(storageKeys.tarefas) || "null");

    if (!Array.isArray(escala)) {
      return null;
    }

    return {
      escala,
      tarefas: Array.isArray(tarefas) ? tarefas : criarTarefas5S(escala.map(({ nome }) => nome))
    };
  } catch (error) {
    return null;
  }
}

function renderizarEscala(escala) {
  const linhas = escala
    .map(({ nome, rotacao }) => {
      const colunas = rotacao.map((posto) => `<td>${escaparHTML(posto)}</td>`).join("");
      return `<tr><td>${escaparHTML(nome)}</td>${colunas}</tr>`;
    })
    .join("");

  document.getElementById("escalaContainer").innerHTML = `
    <div class="card">
      <div class="card-header">
        <h2>Escala da Semana</h2>
        <span>${escala.length} colaboradores</span>
      </div>

      <div class="tabela-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              ${dias.map((dia) => `<th>${dia}</th>`).join("")}
            </tr>
          </thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderizarTarefas5S(tarefas) {
  const linhas = tarefas
    .map(
      ({ tarefa, nome }) => `
        <tr>
          <td>${escaparHTML(tarefa)}</td>
          <td>${escaparHTML(nome)}</td>
        </tr>
      `
    )
    .join("");

  document.getElementById("tarefasContainer").innerHTML = `
    <div class="card tarefas-card">
      <div class="card-header">
        <h2>Organizacao 5S</h2>
        <span>4 colaboradores por geracao</span>
      </div>

      <div class="tabela-wrapper">
        <table class="tarefas-table">
          <thead>
            <tr>
              <th>Tarefa</th>
              <th>Colaborador</th>
            </tr>
          </thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
    </div>
  `;
}

function gerarNovaSemana() {
  const nomes = obterNomes();

  if (nomes.length === 0) {
    document.getElementById("escalaContainer").innerHTML = `
      <div class="card aviso">
        Informe pelo menos um colaborador para gerar a escala.
      </div>
    `;
    document.getElementById("fluxogramaContainer").innerHTML = "";
    document.getElementById("tarefasContainer").innerHTML = "";
    return;
  }

  const escala = criarEscala(nomes);
  const tarefas = criarTarefas5S(nomes);

  renderizarEscala(escala);
  renderizarTarefas5S(tarefas);
  gerarFluxograma();
  salvarEscala(escala, tarefas);
}

function gerarFluxograma() {
  const primeiraLinha = postos
    .slice(0, 9)
    .map((posto, index, lista) => `
      <div class="caixa">${escaparHTML(posto)}</div>
      ${index < lista.length - 1 ? '<div class="seta">-></div>' : ""}
    `)
    .join("");

  const segundaLinha = postos
    .slice(9)
    .reverse()
    .map((posto, index, lista) => `
      <div class="caixa">${escaparHTML(posto)}</div>
      ${index < lista.length - 1 ? '<div class="seta"><-</div>' : ""}
    `)
    .join("");

  document.getElementById("fluxogramaContainer").innerHTML = `
    <div class="card">
      <div class="card-header">
        <h2>Fluxograma da Rotatividade</h2>
        <span>${postos.length} postos</span>
      </div>

      <div class="fluxograma">
        <div class="linha">${primeiraLinha}</div>
        <div class="vertical">v</div>
        <div class="linha">${segundaLinha}</div>
        <div class="vertical">^</div>
      </div>
    </div>
  `;
}

function aguardarImagens(container) {
  const imagens = [...container.querySelectorAll("img")];

  return Promise.all(
    imagens.map((img) => {
      if (img.complete) {
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );
}

async function exportarPDF() {
  const escala = document.getElementById("escalaContainer");
  const tarefas = document.getElementById("tarefasContainer");
  const fluxograma = document.getElementById("fluxogramaContainer");
  const exportArea = document.createElement("div");

  exportArea.className = "pdf-export";
  exportArea.innerHTML = `
    <header class="pdf-cabecalho">
      <img src="assets/mbb.jpg" alt="Mercedes-Benz">
      <div>
        <h1>Painel Inteligente de Rotatividade</h1>
        <p>${escaparHTML(document.getElementById("semanaAtual").textContent)}</p>
      </div>
    </header>
    <section class="resultado-grid">
      <div>${escala.innerHTML}</div>
      <div>${tarefas.innerHTML}</div>
    </section>
    <section>${fluxograma.innerHTML}</section>
  `;

  document.body.appendChild(exportArea);
  document.body.classList.add("gerando-pdf");

  await aguardarImagens(exportArea);

  try {
    await html2pdf()
      .set({
      margin: 0.15,
      filename: "rotatividade.pdf",
      pagebreak: { mode: ["avoid-all"] },
      html2canvas: {
        scale: 2,
        useCORS: true
      },
      jsPDF: {
        unit: "in",
        format: "a4",
        orientation: "landscape"
      }
    })
      .from(exportArea)
      .save();
  } finally {
    exportArea.remove();
    document.body.classList.remove("gerando-pdf");
  }
}

function atualizarSemana() {
  const hoje = new Date();

  document.getElementById("semanaAtual").textContent =
    hoje.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
}

function iniciarPainel() {
  const dadosSalvos = carregarDadosDaSemana();

  if (dadosSalvos) {
    renderizarEscala(dadosSalvos.escala);
    renderizarTarefas5S(dadosSalvos.tarefas);
    gerarFluxograma();
    return;
  }

  gerarNovaSemana();
}

atualizarSemana();
iniciarPainel();
