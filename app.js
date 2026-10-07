/* Grimório de Mesa — consulta rápida de regras.
   O conteúdo fica nos arquivos .json; este arquivo só lê e mostra. */
(function () {
  "use strict";

  var CATEGORIAS = {
    regra:    { rotulo: "Regra",    plural: "Regras",    letra: "R", cor: "var(--cat-regra)" },
    condicao: { rotulo: "Condição", plural: "Condições", letra: "C", cor: "var(--cat-condicao)" },
    acao:     { rotulo: "Ação",     plural: "Ações",     letra: "A", cor: "var(--cat-acao)" },
    magia:    { rotulo: "Magia",    plural: "Magias",    letra: "M", cor: "var(--cat-magia)" },
    classe:   { rotulo: "Classe",   plural: "Classes",   letra: "Cl", cor: "var(--cat-classe)" },
    antecedente: { rotulo: "Antecedente", plural: "Antecedentes", letra: "An", cor: "var(--cat-origem)" },
    especie:  { rotulo: "Espécie",  plural: "Espécies",  letra: "Es", cor: "var(--cat-origem)" },
    talento:  { rotulo: "Talento",  plural: "Talentos",  letra: "T", cor: "var(--cat-talento)" },
    equipamento: { rotulo: "Equipamento", plural: "Equipamento", letra: "Eq", cor: "var(--cat-equip)" },
    criatura: { rotulo: "Criatura", plural: "Criaturas", letra: "Cr", cor: "var(--cat-criatura)" }
  };
  var ORDEM_CAT = ["regra", "condicao", "acao", "antecedente", "especie", "talento", "equipamento", "criatura", "magia", "classe"];
  var FONTE_PADRAO = "SRD 5.2 · tradução para consulta de mesa";
  // Abas seguindo os capítulos do Livro do Jogador
  var ABAS = [
    { id: "jogo",      cap: "Cap. 1", nome: "Jogando o Jogo" },
    { id: "criacao",   cap: "Cap. 2", nome: "Criação" },
    { id: "classes",   cap: "Cap. 3", nome: "Classes" },
    { id: "origens",   cap: "Cap. 4", nome: "Origens" },
    { id: "talentos",  cap: "Cap. 5", nome: "Talentos" },
    { id: "equipamento", cap: "Cap. 6", nome: "Equipamento" },
    { id: "magias",    cap: "Cap. 7", nome: "Magias" },
    { id: "apendices", cap: "Ap. A–B", nome: "Apêndices" },
    { id: "glossario", cap: "Ap. C", nome: "Glossário" },
    { id: "favoritos", cap: "Seus",   nome: "★ Favoritos" }
  ];
  function capitulo(e) {
    if (e.capitulo) return e.capitulo;
    if (e.categoria === "classe") return "classes";
    if (e.categoria === "magia") return "magias";
    return "jogo";
  }
  // Ícones das classes: game-icons.net (Lorc e Delapouite), licença CC BY 3.0
  var ICONES = {
    artifice: "M265.344 17.5l-4.188 25.313c-17.994-.1-35.62 2.066-52.562 6.28l-9.438-25.062-55.125 20.75 9.907 26.282c-15.008 8.587-28.96 18.95-41.5 30.876L90 83.53l-37.375 45.5L75.75 148c-8.54 14.428-15.47 30.036-20.5 46.594l-30.063-4.97-9.593 58.095L46 252.75c-.374 17.218 1.313 34.127 4.906 50.438L22 314.063l20.75 55.125 28.625-10.782c8.07 15.027 17.91 29.046 29.28 41.75L81.688 423.25l45.532 37.344 18.343-22.344c14.386 9.118 30.04 16.577 46.687 22.125l-4.53 27.5 58.093 9.594 4.343-26.283c18.046.874 35.764-.54 52.875-4.03l8.97 23.78 55.094-20.75-8.53-22.656c16.126-8.343 31.134-18.683 44.655-30.78l17.936 14.72 37.344-45.533-17.188-14.093c9.733-15.35 17.606-32.125 23.25-50.03l21.407 3.53 9.56-58.094-21.06-3.47c.608-18.84-1.282-37.305-5.408-55.06l19.844-7.47-20.75-55.125-20.187 7.594c-8.89-16.114-19.817-31.033-32.5-44.376l14.155-17.25-45.5-37.375-14.72 17.936c-15.396-9.116-32.13-16.37-49.936-21.47l3.967-24.092-58.093-9.594zm-8.03 47.938c11.136-.15 22.437.685 33.81 2.562C395.113 85.164 465.665 183.606 448.5 287.594 431.336 391.58 332.894 462.134 228.906 444.97 124.92 427.803 54.366 329.36 71.53 225.374c15.02-90.99 92.292-156.386 181.032-159.813 1.585-.06 3.16-.103 4.75-.124zm.217 18.687c-1.437.018-2.88.04-4.31.094-80.154 3.037-149.672 61.917-163.25 144.186-15.52 94.022 47.977 182.606 142 198.125 94.02 15.52 182.573-47.977 198.093-142 15.52-94.02-47.947-182.573-141.97-198.092-10.283-1.698-20.496-2.44-30.562-2.313zm.408 18.156c9-.116 18.145.546 27.343 2.064 84.096 13.88 140.85 93.092 126.97 177.187-13.88 84.096-93.06 140.85-177.156 126.97-25.808-4.26-49.03-14.68-68.438-29.5l109.688-133.625 52.844 43.375 58.437-71.188-108.22-88.78-101.842 35.53 71 58.25L140.78 353.938c-26.985-33.066-40.165-77.126-32.655-122.625 12.146-73.583 74.283-126.223 145.97-128.937 1.28-.048 2.557-.077 3.843-.094z",
    barbaro: "M240.094 19.594c-56.69.364-110.882 29.054-151.594 72.344-53.428 56.81-81.948 137.907-61.03 210.093 16.33-8.797 32.757-15.987 48.936-21.374-6.327-123.16 89.247-210.922 200.03-210.344 4.255-13.365 10.268-27.308 18.127-41.874-16.323-5.43-32.736-8.36-48.97-8.782-1.833-.047-3.67-.074-5.5-.062zM271.28 88.97C173.724 90.715 91.367 166.07 94.907 275.28c10.986-2.73 21.788-4.582 32.28-5.436 14.59-1.187 28.69-.463 41.783 2.437L278.312 162.94c-5.26-12.1-8.473-25.024-9.344-38.75-.716-11.256.14-22.983 2.592-35.22-.093.002-.187 0-.28 0zm60.845 60.718l-16.875 16.875L345.75 197l16.813-16.813-30.438-30.5zm-37.125 23L175.625 292.063l44.625 44.562 119.313-119.313L295 172.688zm189.875 46.093c-14.466 7.808-28.318 13.807-41.594 18.064.75 111.013-87.243 206.8-210.686 200.28-5.39 16.104-12.552 32.462-21.313 48.72 72.19 20.922 153.313-7.6 210.126-61.03 57.045-53.65 88.516-130.72 63.47-206.033zm-136 15.657L240.687 342.625c3.23 13.563 4.086 28.245 2.844 43.47-.862 10.58-2.752 21.476-5.53 32.56 109.585 3.718 185.128-79.008 186.594-176.905-12.342 2.506-24.16 3.403-35.5 2.688-14.287-.9-27.698-4.347-40.22-10zM169.5 312.313L20.094 461.72V494H48.75l151.188-151.188-30.438-30.5z",
    bardo: "M108.656 35.063c-15.053.138-33.413 5.378-46.97 15.812-10.75 8.276-18.777 19.27-21.186 34.438.21-.126.414-.252.625-.376-.843 2.816-1.313 5.786-1.313 8.876 0 17.087 13.85 30.937 30.938 30.937 14.293 0 26.324-9.705 29.875-22.875.028-.115.067-.23.094-.344.48-2.082.768-4.042.905-5.843.025-.327.017-.65.03-.968.005-.126.03-.25.032-.376.007-.182-.002-.353 0-.53 0-1.526-.098-3.036-.312-4.5-1.367-8.018-6.778-12.156-12.594-13.72-8.527-2.293-19.055.637-23.75 18.156l-.468-.125C62.04 74.12 72.213 63.885 83.94 60.78c2.476-.654 5.053-1.005 7.656-.968 9.072.13 18.445 4.88 24.562 17.126.087.173.165.355.25.53 5.208 15.233 2.11 43.32-3.344 57.626-7.288 18.753-22.376 40.504-47.687 65.5C6.99 258.252 4 329.824 39.97 388.814 75.936 447.8 152.13 493.56 254.437 493.56c102.306 0 178.47-45.76 214.437-104.75 35.882-58.848 32.982-130.225-25-187.812l-.406-.406h-.033c-25.31-24.996-40.367-46.747-47.656-65.5-5.23-16.453-9.09-42.988-2.655-57.625.058-.128.128-.25.188-.376.025-.05.037-.106.062-.156 6.117-12.246 15.49-16.996 24.563-17.126 2.602-.037 5.18.314 7.656.97 11.724 3.102 21.87 13.337 19.344 32.843l-.438.125c-4.694-17.52-15.222-20.45-23.75-18.156-4.41 1.185-8.603 3.85-10.97 8.562-.012.04-.017.085-.03.125-.975 3.007-1.5 6.203-1.5 9.532 0 17.088 13.85 30.938 30.938 30.938 17.087 0 30.937-13.85 30.937-30.938 0-4.355-.907-8.49-2.53-12.25-3.058-13.244-10.598-23.112-20.44-30.687-14.458-11.13-34.39-16.363-49.936-15.78-13.378.5-24.85 4.108-33.22 10.53-3.412 2.617-6.383 5.702-8.844 9.375-69.455 35.508-138.89 38.75-208.344-7.75-.642-.557-1.29-1.105-1.968-1.625-8.37-6.422-19.843-10.03-33.22-10.53-.97-.037-1.964-.042-2.968-.032zm52.78 53.124c6.338 2.648 12.666 4.987 19 7.032v313.06c-30.732-8.258-57.886-22.005-77.374-41.31-17.1-16.94-28.077-38.626-28.906-63.595-.828-24.97 8.274-52.702 28.97-82.625 41.323-59.752 57.163-103.6 58.31-132.563zm186.033 1.407c1.6 28.97 17.593 72.37 58.25 131.156 20.693 29.923 29.796 57.656 28.967 82.625-.828 24.97-11.807 46.654-28.906 63.594-19.023 18.846-45.374 32.4-75.217 40.717V94.844c5.636-1.606 11.27-3.35 16.906-5.25zm-35.595 10v312.53c-8.21 1.63-16.606 2.878-25.125 3.782V104.094c8.376-1.122 16.75-2.63 25.125-4.5zm-112.75.78c8.45 1.97 16.894 3.442 25.344 4.44v311.342c-8.59-.84-17.057-2.05-25.345-3.625V100.376zm68.938 5.564v311.375c-4.54.198-9.088.312-13.657.312-3.76 0-7.506-.053-11.25-.188V106.28c8.293.314 16.614.18 24.906-.343z",
    bruxo: "M256 16l-32 112 32 32 32-32-32-112zM64 96l32 80 64 16-96-96zm384 0l-96 96 64-16 32-80zm-192 80l-64 48-128 32c80 16 128 96 192 128 64-32 112.476-110.213 192-128l-128-28.31L256 176zm-39.512 52.682l28.342 8.863-7.45 20.955L256 310.895l18.62-52.395-7.45-20.955 28.342-8.863c14.923 10.97 24.488 28.03 24.488 47.283C320 309.237 291.47 336 256 336s-64-26.763-64-60.035c0-19.254 9.565-36.314 24.488-47.283zM96 336l-64 48-16 64 32-32 64-48s-16-27.61-16-32zm320 0l-16 32 64 48 32 32-16-64-64-48zm-272 64l-16 64 48-48-32-16zm112 0l-48 16 48 80 48-80-48-16zm112 0l-32 16 48 48-16-64z",
    clerigo: "M478.6 22.09c-11.2 11.31-19.5 24.46-26.3 38.48l25 37.39c4.4-3.16 9.9-6.06 16.9-8.54-20.7-10.02-26.7-29.08-10.3-44.81zm-445.2.59L28.1 45.2c16.4 15.73 10.4 34.79-10.3 44.81 6.7 2.39 12.03 5.16 16.41 8.18l25.13-37.72C52.66 46.71 44.39 33.8 33.4 22.68zm187 4.16l-17.2 5.26 9.1 29.74c5.4-2.42 11.1-4.42 17-5.95zm70.8 0l-8.9 29.05c5.9 1.53 11.6 3.53 17 5.95l9.1-29.74zm-141 28.27l-12.8 12.72 28.8 28.89c1-1.11 1.9-2.2 2.9-3.28 3.1-3.36 6.3-6.6 9.7-9.68zm211.2 0l-28.6 28.65c3.4 3.08 6.6 6.32 9.7 9.68 1 1.06 1.9 2.14 2.8 3.22l28.9-28.83zM255.8 70.47c-29 0-54.7 14.55-73.3 35.03-16.1 17.7-26.5 39.8-29 59h204.6c-2.5-19.2-12.9-41.3-29-59-18.6-20.48-44.3-35.03-73.3-35.03zM61.38 89.87L40.52 121.1c-7.14 61 8.68 105.3 31.39 126.3C83.38 258 96.3 262.9 110 262c13.7-.8 28.6-7.6 43.4-22.4l11.9-11.9 3.3 16.5c7.8 38.7 23.2 69.4 40.2 90.1 16.9 20.7 35.5 30.7 47 30.7s30.1-10 47-30.7c17-20.7 32.4-51.4 40.2-90.1l3.3-16.5 11.9 11.9c14.8 14.8 29.7 21.6 43.4 22.4 13.7.9 26.6-4 38.1-14.6 22.7-21 38.5-65.3 31.4-126.3l-20.9-31.23c-15.4 40.03-35.1 68.73-63.4 87.63-13 8.6-27.5 15.1-44 19.7-4.2 17.9-14.7 38.6-27.5 57.8-8.3 12.5-17.7 24-27.5 32.7-9.9 8.8-20.2 15.3-32 15.3s-22.1-6.5-32-15.3c-9.8-8.7-19.2-20.2-27.5-32.7-12.8-19.2-23.3-39.9-27.5-57.8-16.5-4.6-31-11.1-44-19.7-28.28-18.9-47.97-47.6-63.42-87.63zM114.6 117l-5.6 17 30.5 10.1c1.8-5.5 4-11.1 6.6-16.6zm282.4 0l-31.5 10.5c2.6 5.5 4.8 11.1 6.6 16.6l30.5-10.1zm-177.5 65.5c5.7 17.9 20.2 30 36.3 30 16.1 0 30.6-12.1 36.3-30zm-30 19.5c4.7 13 12.4 29 21.8 43 7.7 11.5 16.3 22 24.5 29.3 8.1 7.2 15.8 10.7 20 10.7 4.2 0 11.9-3.5 20-10.7 8.2-7.3 16.8-17.8 24.5-29.3 9.4-14 17.1-30 21.8-43-6.7 1.2-13.7 2.2-21 2.9-10.3 15.4-26.5 25.6-45.3 25.6-18.8 0-35-10.2-45.3-25.6-7.3-.7-14.3-1.7-21-2.9zm-4.6 130.3c-14.8 56.6-37.6 115.1-57 156.7 48.5-10.6 80.3-10.3 118.9.9V382.1c-17.7-3.4-35.7-16.5-52-36.4-3.4-4.2-6.7-8.6-9.9-13.4zm141.8 0c-3.2 4.8-6.5 9.2-9.9 13.4-16.3 19.9-34.3 33-52 36.4v107.8c38.6-11.2 70.4-11.5 118.9-.9-19.4-41.6-42.2-100.1-57-156.7z",
    druida: "M92.239 26.432c-4.705.09-9.496.87-14.37 2.473-19.773 6.506-41.557 59.364-7.411 112.912 9.221 14.46-41 39.289-31.803 67.056 12.387 37.399 99.437 19.933 112.104 42.211 6.44 11.328-79.773 49.284-49.663 81.625 37.951 40.763 76.062 14.109 138.553 23.864 24.685 3.853-26.357 63.343 11.031 86.498 39.948 24.739 118.742 1.986 160.846-20.254a20577.214 20577.214 0 0 0-30.19-36.098c-33.45 10.371-71.807 15.824-106.036 13.664 36.092-6.615 65.118-14.246 94.8-27.025-21.566-25.637-43.299-51.22-65.357-76.479-36.846 7.379-103.783 18.406-166.793 13.88 8.83-1.316 110.772-14.937 154.935-27.38a3177.953 3177.953 0 0 0-24.357-27.318 6823.337 6823.337 0 0 0-27.935-35.486 6485.7 6485.7 0 0 0-15.413-19.34l-.115.658c-31.187 1.8-90.154 3.052-142.9-10.709 7.477.02 92.983 1.716 132.031-3.637-16.65-20.699-32.746-40.434-46.473-56.795-7.035-8.385-13.392-15.81-19.011-22.209l.05-.056c25.401 23.275 50.132 47.542 74.329 72.506 15.57-24.254 32.931-56.653 41.664-80.655 1.469 29.363-15.963 66.66-27.586 95.325 22.456 23.61 44.458 47.79 66.125 72.287 20.118-23.976 44.105-60.316 54.869-83.707-3.957 26.047-31.834 67.188-44.936 94.982 25.142 28.669 49.84 57.727 74.266 86.8 13.506-17.48 28.29-40.286 35.822-57.296 1.32 21.671-14.607 49.312-24.892 70.281l-.05-.014c9.624 11.49 19.211 22.974 28.766 34.428 3.016-2.12 5.604-4.173 7.582-6.095 31.459-30.573 36.26-79.699 17.842-116.51-12.519-25.021-70.096-8.654-77.265-23.846-9.068-19.214 51.563-76.204 28.146-104.902-16.456-20.168-75.04 1.983-85.264-16.182-16.343-29.04 28.13-74.832-21.763-99.244-26.468-12.95-46.397 5.349-88.338 44.103-21.236 19.623-62.13-63.165-113.828-64.312a48.694 48.694 0 0 0-2.012-.004zm345.39 402.365l-13.982 11.336 36.848 45.444 13.98-11.336-36.845-45.444z",
    feiticeiro: "M12.195 20.94v39.128c76.452 73.026 151.387 152.574 187.47 215.5 12.6 21.978 38.114 72.972 49.056 118.557-31.424-3.388-64.762-14.633-96.36-33.873 11.605 19.025 25.57 37.838 42.632 54.898 83.895 83.897 200.548 103.142 260.473 43.217 59.927-59.927 40.678-176.574-43.22-260.47-17.062-17.063-35.872-31.028-54.895-42.633 21.316 35.01 33.27 71.947 35.04 106.29-47.3-13.436-103.76-38.565-127.316-51.976C201.59 173.434 121.32 98.073 47.818 20.938H12.195zM374.89 285.866c47.63 0 86.557 36.296 90.727 82.817-12.225-22.7-36.207-38.133-63.797-38.133-39.995 0-72.42 32.423-72.42 72.42 0 5.462.61 10.78 1.758 15.897 2.835-21.18 21.098-37.674 43.018-37.674 23.866 0 43.414 19.55 43.414 43.414 0 23.866-19.548 43.413-43.414 43.413-1.59 0-3.157-.093-4.703-.262.114.057.225.12.34.176-48.052-2.623-86.028-42.24-86.028-90.96 0-50.428 40.677-91.107 91.104-91.107z",
    guardiao: "M492.656 20.406l-118.594 56.22L413.875 86l-86.97 86.97-305.5 259.374.69.687 104.75-47.467-46.376 105.843.905.906 272.5-319.875 73.22-73.218 9.342 39.81 56.22-118.624zm-473.25.063c-1.347 23.43 5 39.947 16.563 52.218l24.093 302.28 17.562-14.874-21.72-272.438c57.975 31.954 169.096 25.165 216.907 106.72l66.625-56.564 1.22-1.218C292.74 38.666 86.01 99.716 19.406 20.47zm359.531 151.56l-1.156 1.157-57.25 67.188c82.006 47.945 75.587 159.267 107.283 218.03l-272.157-24.5-14.812 17.408 301.562 27.125c12.48 12.283 29.4 19.084 53.688 17.687-79.95-67.2-18.36-275.754-117.156-324.094z",
    guerreiro: "M19.75 14.438c59.538 112.29 142.51 202.35 232.28 292.718l3.626 3.75.063-.062c21.827 21.93 44.04 43.923 66.405 66.25-18.856 14.813-38.974 28.2-59.938 40.312l28.532 28.53 68.717-68.717c42.337 27.636 76.286 63.646 104.094 105.81l28.064-28.06c-42.47-27.493-79.74-60.206-106.03-103.876l68.936-68.938-28.53-28.53c-11.115 21.853-24.413 42.015-39.47 60.593-43.852-43.8-86.462-85.842-130.125-125.47-.224-.203-.432-.422-.656-.625C183.624 122.75 108.515 63.91 19.75 14.437zm471.875 0c-83.038 46.28-154.122 100.78-221.97 161.156l22.814 21.562 56.81-56.812 13.22 13.187-56.438 56.44 24.594 23.186c61.802-66.92 117.6-136.92 160.97-218.72zm-329.53 125.906l200.56 200.53c-4.36 4.443-8.84 8.793-13.405 13.032L148.875 153.53l13.22-13.186zm-76.69 113.28l-28.5 28.532 68.907 68.906c-26.29 43.673-63.53 76.414-106 103.907l28.063 28.06c27.807-42.164 61.758-78.174 104.094-105.81l68.718 68.717 28.53-28.53c-20.962-12.113-41.08-25.5-59.937-40.313 17.865-17.83 35.61-35.433 53.157-52.97l-24.843-25.655-55.47 55.467c-4.565-4.238-9.014-8.62-13.374-13.062l55.844-55.844-24.53-25.374c-18.28 17.856-36.602 36.06-55.158 54.594-15.068-18.587-28.38-38.758-39.5-60.625z",
    ladino: "M254.07 19.707c-56.303 28.998-106.297 107.317-122.64 168.707 32.445 2.11 58.63 12.963 78.638 30.848l9.334-10.198c-13.336-13.056-30.596-23.9-52.994-34.707 12.68-31.542 32.01-79.29 56.598-82.07 9.62-1.088 19.92 4.722 31.13 21.068 35.08-58.334 68.394 18.705 87.727 61.002-21.94 11.897-39.132 22.82-52.63 36.024l8.68 9.76c19.68-17.732 45.72-29.358 78.55-31.673C358.24 127.335 311.515 50.14 254.07 19.707zM219.617 144.57c-8.894 0-16.103 3.952-16.103 8.826 0 4.875 7.21 8.827 16.103 8.827 8.894 0 16.106-3.95 16.106-8.827 0-4.874-7.212-8.826-16.106-8.826zm68.965 0c-8.894 0-16.105 3.952-16.105 8.826 0 4.875 7.21 8.827 16.105 8.827 8.894 0 16.106-3.95 16.106-8.827 0-4.874-7.212-8.826-16.106-8.826zm-118.894 70.88c-2.19 3.672-4.343 7.497-6.444 11.52-25.587 48.98-43.26 123.643-43.896 223.48 32.776 18.89 64.322 31.324 95.707 36.988-35.5-24.36-60.375-80.893-60.375-146.754 0-45.97 12.12-87.39 31.51-116.506-5.098-3.372-10.583-6.29-16.502-8.727zm168.933.35c-5.852 2.477-11.27 5.412-16.298 8.764 19.24 29.095 31.254 70.354 31.254 116.12 0 65.82-24.844 122.322-60.306 146.707 30.88-5.598 62.44-17.812 95.656-36.947-.638-99.57-18.31-174.163-43.9-223.177-2.088-4.002-4.228-7.81-6.405-11.467zm-97.665 23.61c7.026 22.543 9.128 45.086.98 67.63h-41.552v18.513c10.057-3.24 20.25-5.39 30.502-6.594.066 50.215 1.313 96.574 19.82 145.435l4.193 11.074 4.485-10.962c19.48-47.615 18.045-95.297 17.933-145.024 10.257 1.333 20.463 3.4 30.545 6.07v-18.515h-41.374c-6.888-22.544-5.932-45.087.803-67.63h-26.335z",
    mago: "M335.656 19.53c-24.51.093-48.993 5.235-71.062 15.626-22.46 10.577-43.112 34.202-58.375 62.563-15.264 28.36-25.182 61.262-27.69 88.75-7.487 82.112-51.926 155.352-159.78 252.56l-.188 21.44C89.216 403.443 139.915 346.632 176.313 290l.063.03c-9.293 32.473-22.623 63.18-43.594 87.97-31.47 35.584-69.222 71.1-114.468 106.53l-.062 8.25 25 .064h.47l1.28-1.156c24.405-16.498 48.607-31.488 72.594-41.5l.187.187-46.436 42.5 28.937.063c48.372-41.685 94.714-90.58 129.626-137 33.587-44.658 56.02-87.312 60.688-116.844-1.268-2.32-2.552-4.628-3.656-7.094-18.833-42.06-4.273-96.424 40.218-116.063 32.73-14.45 74.854-3.165 90.438 31.344.15.333.324.634.47.97 13.302 24.062 6.175 49.48-9.345 61.97-7.866 6.328-18.442 9.528-28.75 6.56-10.31-2.966-19.043-11.772-24.5-25.124l17.28-7.062c3.992 9.764 8.667 13.15 12.375 14.22 3.708 1.066 7.767.148 11.875-3.158 8.216-6.61 14.282-21.91 4.406-39.03l-.28-.47-.22-.5c-10.7-24.82-41.96-33.333-66.22-22.625-34.063 15.037-45.594 58.052-30.686 91.345 20.527 45.846 77.97 61.177 122.375 40.875 60.157-27.5 80.13-103.328 53.094-161.813-24.737-53.503-81.41-82.484-138.908-83.843-1.633-.04-3.272-.07-4.906-.063zm-25.75 26.72c3.238.035 6.363.348 9.406.906 10.343 1.898 19.946 6.753 29.032 13.25-30.623-5.437-58.324 4.612-80.78 24.782-22.44 20.152-39.16 50.59-45.783 84.718-4.655-11.358-7.166-21.462-6.686-31.72.296-6.343 1.715-12.956 4.78-20.217 9.094-18.016 21.032-33.946 35.22-46.69 7.824-7.026 16.39-13.07 25.53-17.905 10.932-5.212 20.522-7.22 29.282-7.125zm122.938 62.313c22.583 13.167 34.365 41.86 32.937 70.656-.564 11.395-3.466 22.975-8.905 33.624-12.48 18.937-35.53 25.51-49.97 20.875l-.092-.25c27.943-10.365 39.18-32.377 40.312-55.19.124-2.5.115-4.994-.03-7.468 1.447-13.31-.412-28.793-5.47-43.437-2.244-6.496-5.15-12.89-8.844-18.72l.064-.093zm-135.563 1.312c-20.97 19.342-29.406 35.252-33.25 51.25-3.848 16.023-2.788 32.84-2.905 52.875-.14 23.79-2.56 51.542-18.438 85.688-.005.012-.025.018-.03.03-21.095 26.753-45.276 52.25-68.907 67.376l-.063-.03c64.195-71.545 68.527-114.792 68.75-153.19.112-19.197-1.253-37.594 3.438-57.124.57-2.37 1.233-4.742 2-7.125h.03c8.098-17.036 16.572-26.058 25.47-31.563 7.18-4.44 15.035-6.697 23.906-8.187z",
    monge: "M227.227 21.777c-1.845 0-3.704.05-5.567.157-15.314.875-30.76 5.305-39.494 10.863l-.008 73.15c2.884-.094 5.777-.147 8.676-.142 23.382.036 47.104 3.286 68.47 9.513l.01-87.507c-7.034-3.518-19.178-6.03-32.087-6.033zm80.74 9.16c-11.925.15-23.077 2.364-29.967 5.596l-.008 77.602v7.658c38.486 15.67 64.814 42.48 58.735 78.764l-.96 5.73-5.562 1.674c-17.45 5.253-34.872 9.703-52.225 13.335V246.53c25.562-.704 51.327-2.687 77.145-6.098l.02-197.928c-8.284-5.563-23.508-10.243-38.842-11.328-2.792-.198-5.584-.273-8.336-.238zM143.223 46.294c-1.176-.015-2.374-.01-3.588.02-4.175.1-8.533.468-12.903 1.152-15.67 2.454-31.477 8.565-40.406 15.402l-.01 72.955c18.808-15.81 46.704-25.143 77.15-28.54l.007-57.966c-4.82-1.752-12.018-2.916-20.25-3.023zm258.394 3.46c-10.804.117-20.722 1.93-27.043 4.655l-.02 183.182c25.074-4.02 50.16-9.412 75.122-16.358l1.99-158.447c-8.352-5.9-23.648-11.025-39.05-12.553-3.698-.366-7.398-.517-11-.478zm-222.775 74.202c-53.72.702-101.407 20.365-97.887 66.6 15.836-3.918 30.84-5.893 44.94-6.1 34.84-.51 64.213 9.704 87.318 27.613 34.608-3.11 69.852-10 105.412-20.314.14-41.287-74.098-68.657-139.783-67.8zm-48.877 78.65c-1.296-.003-2.603.012-3.92.045-17.256.436-36.45 4.03-57.566 11.037 5.79 53.808 26.325 106.41 58.5 143.346 6.226 7.15 12.856 13.712 19.875 19.615 29.303 9.282 69.26 12.917 110.534 12.14 3.777-55.805-8.717-108.357-36.193-142.74-21.265-26.61-51.064-43.39-91.232-43.444zm129.326 22.282c-9.358 1.637-18.69 3.016-27.995 4.15 1.54 1.74 3.043 3.52 4.502 5.346 3.146 3.937 6.094 8.062 8.873 12.334 9.916.144 19.868.125 29.857-.106H259.29v-21.723zm191.817 15.343c-65.406 17.826-131.462 25.41-195.85 25.315 16.998 35.144 23.828 78.093 21.013 122.6 42.482-2.08 85.03-8.23 118.187-15.983 26.693-32.78 47.37-77.118 56.65-131.932zM400.51 389.9c-38.334 9.145-87.95 16.056-136.873 17.454-47.67 1.36-94.336-2.228-129.448-15.262l-.01 78.93c27.187 12.568 76.414 20.205 127.318 20.298 51.224.094 104.214-7.173 139-20.773l.012-80.647z",
    paladino: "M256 21.938l-4.025 2.01c-96 48-93.455 47.175-189.455 63.175l-8.592 1.432 1.15 8.634c16.125 120.934 48.338 217.868 85.022 285.12 18.34 33.627 37.776 59.85 57.263 78.022C216.85 478.502 236.625 489 256 489s39.15-10.497 58.637-28.668c19.487-18.17 38.922-44.395 57.263-78.02 36.684-67.254 68.897-164.188 85.022-285.123l1.15-8.635-8.592-1.432c-96-16-93.455-15.174-189.455-63.174L256 21.937zM224 64c16 0 16 0 32 16 16-16 16-16 32-16-16 16-16 16-16 32l2.666 48h109.158S400 144 416 128c0 16 0 16-16 32 16 16 16 16 16 32-16-16-32.176-16-32.176-16h-107.38L288 384s0 32 16 64c-16 0-48 0-48-16 0 16-32 16-48 16 16-32 16-64 16-64l11.555-208H128.13S112 176 96 192c0-16 0-16 16-32-16-16-16-16-16-32 16 16 32.13 16 32.13 16h109.204L240 96c0-16 0-16-16-32z"
  };
  function iconeClasse(e) {
    if (e.categoria !== "classe") return "";
    var d = ICONES[e.de || e.id];
    return d ? '<svg viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="' + d + '"/></svg>' : "";
  }
  var NOMES_OPCOES = { "Invocação": "Invocações Místicas", "Metamagia": "Opções de Metamagia", "Manobra": "Manobras" };

  var estado = {
    entradas: [],
    porId: {},
    versao: null,
    aba: "jogo",
    busca: "",
    scrollLista: 0,
    veioDaLista: false,
    ultimaCarga: 0,
    filtroClasse: ""
  };
  try { estado.filtroClasse = localStorage.getItem("grimorio:classe-magias") || ""; } catch (e) {}

  var app = document.getElementById("app");
  var campoBusca = document.getElementById("busca");
  var botaoLimpar = document.getElementById("limpar");

  /* ---------- armazenamento local (pode falhar em modo privado) ---------- */
  function ler(chave, padrao) {
    try { var v = localStorage.getItem(chave); return v === null ? padrao : JSON.parse(v); }
    catch (e) { return padrao; }
  }
  function gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { /* sem armazenamento */ }
  }
  var favoritos = ler("grimorio:favoritos", []);

  /* ---------- utilitários ---------- */
  function normalizar(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function rotuloNivel(n) { return n === 0 ? "Truque" : n + "º círculo"; }

  /* ---------- texto formatado (Markdown simplificado) ---------- */
  function inline(t) {
    t = esc(t);
    t = t.replace(/\[\[([a-z0-9\-]+)(?:\|([^\]]+))?\]\]/g, function (_, id, rotulo) {
      var alvo = estado.porId[id];
      var texto = rotulo || (alvo ? alvo.nome : id);
      if (!alvo) return texto;
      return '<a class="ref" href="#' + id + '">' + texto + "</a>";
    });
    t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    return t;
  }

  function celulas(linha) {
    return linha.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(function (c) { return c.trim(); });
  }

  function formatar(texto, aninhado) {
    var hTag = aninhado ? "h4" : "h3";
    var linhas = String(texto || "").split("\n");
    var html = [];
    var i = 0;
    while (i < linhas.length) {
      var l = linhas[i];
      if (!l.trim()) { i++; continue; }
      if (l.indexOf("### ") === 0) {
        html.push("<" + hTag + ">" + inline(l.slice(4)) + "</" + hTag + ">"); i++; continue;
      }
      if (l.indexOf("- ") === 0) {
        var itens = [];
        while (i < linhas.length && linhas[i].indexOf("- ") === 0) { itens.push("<li>" + inline(linhas[i].slice(2)) + "</li>"); i++; }
        html.push("<ul>" + itens.join("") + "</ul>"); continue;
      }
      if (l.trim().charAt(0) === "|") {
        var bloco = [];
        while (i < linhas.length && linhas[i].trim().charAt(0) === "|") { bloco.push(linhas[i]); i++; }
        var cab = celulas(bloco[0]);
        var corpo = bloco.slice(1).filter(function (b) { return !/^\|?\s*:?-{2,}/.test(b.trim()); });
        var t = "<div class=\"tabela\"><table" + (cab.length >= 8 ? " class=\"larga muito-larga\"" : cab.length >= 5 ? " class=\"larga\"" : "") + "><thead><tr>" +
          cab.map(function (c) { return "<th>" + inline(c) + "</th>"; }).join("") + "</tr></thead><tbody>" +
          corpo.map(function (b) { return "<tr>" + celulas(b).map(function (c) { return "<td>" + inline(c) + "</td>"; }).join("") + "</tr>"; }).join("") +
          "</tbody></table></div>";
        html.push(t); continue;
      }
      var par = [];
      while (i < linhas.length && linhas[i].trim() && linhas[i].indexOf("- ") !== 0 && linhas[i].indexOf("### ") !== 0 && linhas[i].trim().charAt(0) !== "|") {
        par.push(linhas[i]); i++;
      }
      html.push("<p>" + inline(par.join(" ")) + "</p>");
    }
    return html.join("");
  }

  function referencias(texto) {
    var ids = [];
    String(texto || "").replace(/\[\[([a-z0-9\-]+)/g, function (_, id) { if (ids.indexOf(id) < 0) ids.push(id); });
    return ids;
  }

  /* ---------- busca ---------- */
  // Termos antigos ou alternativos que também devem encontrar a entrada
  var SINONIMOS = [
    ["salvaguarda", "teste de resistencia"],
    ["imobiliz", "agarrado agarrar agarrao"],
    ["contido", "impedido restrito"],
    ["correr", "disparada"],
    ["analisar", "estudar"],
    ["usar magia", "acao magia conjurar"],
    ["trilha", "caminho"]
  ];

  function prepararIndice(e) {
    e._nome = normalizar(e.nome);
    e._en = normalizar(e.nome_en);
    e._tags = normalizar((e.tags || []).join(" "));
    e._resumo = normalizar(e.resumo);
    e._texto = normalizar(String(e.texto || "").replace(/\[\[[a-z0-9\-]+\|?/g, "").replace(/[\]*#|]/g, " "));
    e._refs = referencias(e.texto);
    var tudo = e._nome + " " + e._tags + " " + e._resumo + " " + e._texto;
    SINONIMOS.forEach(function (s) { if (tudo.indexOf(s[0]) >= 0) e._tags += " " + s[1]; });
  }

  function pontuar(e, consulta, termos) {
    var total = 0;
    for (var i = 0; i < termos.length; i++) {
      var t = termos[i];
      var p = 0;
      if (e._nome.indexOf(t) >= 0) p = 60;
      else if (e._en.indexOf(t) >= 0) p = 50;
      else if (e._tags.indexOf(t) >= 0) p = 30;
      else if (e._resumo.indexOf(t) >= 0) p = 15;
      else if (e._texto.indexOf(t) >= 0) p = 5;
      if (!p) return 0;
      total += p;
    }
    if (e._nome === consulta || e._en === consulta) total += 200;
    else if (e._nome.indexOf(consulta) === 0 || e._en.indexOf(consulta) === 0) total += 100;
    return total;
  }

  function ordenarPadrao(a, b) {
    var ca = ORDEM_CAT.indexOf(a.categoria), cb = ORDEM_CAT.indexOf(b.categoria);
    if (ca !== cb) return ca - cb;
    if (a.categoria === "classe") {
      var ka = a.de || a.id, kb = b.de || b.id;
      if (ka !== kb) return ka.localeCompare(kb, "pt-BR");
      var ra = !a.de ? 0 : (a.subclasse ? 2 : 1), rb = !b.de ? 0 : (b.subclasse ? 2 : 1);
      if (ra !== rb) return ra - rb;
      if (a.subclasse !== b.subclasse) return String(a.subclasse).localeCompare(String(b.subclasse), "pt-BR");
      if (a.tipo !== b.tipo) return a.tipo === "subclasse" ? -1 : 1;
      if ((a.nivel || 0) !== (b.nivel || 0)) return (a.nivel || 0) - (b.nivel || 0);
    }
    if (a.magia && b.magia && a.magia.nivel !== b.magia.nivel) return a.magia.nivel - b.magia.nivel;
    return a.nome.localeCompare(b.nome, "pt-BR");
  }

  function resultados() {
    var consulta = normalizar(estado.busca).trim();
    if (!consulta) return [];
    var termos = consulta.split(/\s+/);
    return estado.entradas
      .map(function (e) { return { e: e, p: pontuar(e, consulta, termos) }; })
      .filter(function (r) { return r.p > 0; })
      .sort(function (a, b) { return b.p - a.p || ordenarPadrao(a.e, b.e); })
      .map(function (r) { return r.e; });
  }

  /* ---------- vistas ---------- */
  function chip(valor, rotulo, ativo, n, attr) {
    return '<button type="button" class="chip" ' + (attr || "data-filtro") + '="' + valor + '" aria-pressed="' + (ativo ? "true" : "false") + '">' +
      esc(rotulo) + (n !== undefined ? '<span class="n">' + n + "</span>" : "") + "</button>";
  }

  function contar(cat) { return estado.entradas.filter(function (e) { return (!cat || e.categoria === cat) && !e.de; }).length; }

  function nomeClasse(e) { var c = e.de && estado.porId[e.de]; return c ? c.nome : ""; }
  function rotuloLado(e) {
    if (e.magia) return rotuloNivel(e.magia.nivel);
    if (e.tipo === "subclasse") return "Subclasse";
    if (e.categoria === "talento" && e.sub_curto) return e.sub_curto;
    if (e.cenario === "eberron" && (e.categoria === "antecedente" || e.categoria === "especie")) return "Eberron";
    if (e.categoria === "equipamento") return e.sub_curto && e.sub_curto !== "Regras" ? e.sub_curto : "Equipamento";
    if (e.de) return (e.sub_curto || e.subclasse || nomeClasse(e)) + " " + (e.nivel || "");
    return (CATEGORIAS[e.categoria] || CATEGORIAS.regra).rotulo;
  }
  function rotuloFicha(e, cat) {
    if (e.magia) return cat.rotulo + " · " + e.magia.escola;
    if (e.tipo === "subclasse") return "Subclasse de " + nomeClasse(e);
    if (e.categoria === "talento" && e.sub_curto) return "Talento · " + e.sub_curto;
    if (e.de) return (e.subclasse || nomeClasse(e)) + " · Nível " + e.nivel;
    return cat.rotulo;
  }

  function itemLista(e) {
    var cat = CATEGORIAS[e.categoria] || CATEGORIAS.regra;
    var lado = rotuloLado(e);
    var fav = favoritos.indexOf(e.id) >= 0 ? ' <span class="estrela" aria-label="Favorito">★</span>' : "";
    return '<li><a class="item" href="#' + e.id + '" style="--cor:' + cat.cor + '">' +
      '<span class="selo' + (iconeClasse(e) ? " selo-icone" : "") + '" aria-hidden="true">' + (iconeClasse(e) || cat.letra) + "</span>" +
      '<span class="item-texto"><span class="item-nome">' + esc(e.nome) + (e.nome_en ? '<span class="item-en">' + esc(e.nome_en) + "</span>" : "") + "</span>" +
      '<span class="item-resumo" style="display:block">' + esc(e.resumo || "") + "</span></span>" +
      '<span class="item-lado">' + esc(lado) + fav + "</span></a></li>";
  }

  function renderAbas() {
    var nav = document.getElementById("abas");
    if (!nav) return;
    var buscando = !!estado.busca.trim();
    nav.innerHTML = ABAS.map(function (a) {
      var ativa = !buscando && estado.aba === a.id;
      return '<button type="button" class="aba" data-aba="' + a.id + '" aria-pressed="' + ativa + '">' +
        '<span class="aba-cap">' + esc(a.cap) + '</span><span class="aba-nome">' + esc(a.nome) + "</span></button>";
    }).join("");
    var ativa = nav.querySelector('[aria-pressed="true"]');
    if (ativa) nav.scrollLeft = Math.max(0, ativa.offsetLeft - 8);
  }

  function secao(titulo, itens, extra) {
    if (!itens.length) return "";
    return '<section class="secao"><h2 class="secao-titulo">' + esc(titulo) + '<span class="n">' + itens.length + "</span></h2>" +
      (extra || "") + '<ul class="lista">' + itens.map(itemLista).join("") + "</ul></section>";
  }

  function porCapitulo(cap) {
    return estado.entradas.filter(function (e) { return capitulo(e) === cap && !e.de; });
  }

  function vistaLista() {
    renderAbas();
    var html = "";
    if (estado.busca.trim()) {
      var res = resultados();
      html = '<p class="contagem">' + res.length + (res.length === 1 ? " resultado" : " resultados") + " para “" + esc(estado.busca.trim()) + "” em todos os capítulos</p>" +
        (res.length ? '<ul class="lista">' + res.map(itemLista).join("") + "</ul>"
                    : '<p class="vazio">Nada encontrado. Tente outra palavra ou o nome em inglês.</p>');
    } else if (estado.aba === "jogo") {
      var jogo = porCapitulo("jogo").sort(ordenarPadrao);
      html = '<header class="cap-cab"><span class="cap-num">Capítulo 1</span><h2>Jogando o Jogo</h2></header>' +
        secao("Regras", jogo.filter(function (e) { return e.categoria === "regra"; })) +
        secao("Ações", jogo.filter(function (e) { return e.categoria === "acao"; })) +
        secao("Condições", jogo.filter(function (e) { return e.categoria === "condicao"; }));
    } else if (estado.aba === "classes") {
      var classes = porCapitulo("classes").sort(ordenarPadrao);
      html = '<header class="cap-cab"><span class="cap-num">Capítulo 3</span><h2>Classes de Personagem</h2></header>' +
        '<ul class="lista">' + classes.map(function (c) {
          var subs = estado.entradas.filter(function (s) { return s.de === c.id && s.tipo === "subclasse"; })
            .sort(function (a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); });
          return itemLista(c).replace("</a></li>", "</a>" +
            '<div class="subs">' + subs.map(function (s) { return '<a class="chip" href="#' + s.id + '">' + esc(s.sub_curto || s.nome) + "</a>"; }).join("") + "</div></li>");
        }).join("") + "</ul>";
    } else if (estado.aba === "origens") {
      var org = porCapitulo("origens").sort(ordenarPadrao);
      var base = org.filter(function (e) { return !e.cenario; }), ebo = org.filter(function (e) { return e.cenario === "eberron"; });
      var cat = function (l, c) { return l.filter(function (e) { return e.categoria === c; }); };
      html = '<header class="cap-cab"><span class="cap-num">Capítulo 4</span><h2>Origens dos Personagens</h2></header>' +
        secao("Regras", cat(base, "regra")) +
        secao("Antecedentes", cat(base, "antecedente")) +
        secao("Espécies", cat(base, "especie")) +
        secao("Eberron · Dracossinais", cat(ebo, "regra")) +
        secao("Eberron · Espécies", cat(ebo, "especie")) +
        secao("Eberron · Antecedentes", cat(ebo, "antecedente"));
    } else if (estado.aba === "talentos") {
      var tal = porCapitulo("talentos").sort(ordenarPadrao);
      var tb = tal.filter(function (e) { return !e.cenario; }), te = tal.filter(function (e) { return e.cenario === "eberron"; });
      var grupo = function (g) { return tb.filter(function (e) { return e.categoria === "talento" && e.sub_curto === g; }); };
      var marca = function (e) { return e.tags.indexOf("dracossinal") >= 0; };
      html = '<header class="cap-cab"><span class="cap-num">Capítulo 5</span><h2>Talentos</h2></header>' +
        secao("Regras", tb.filter(function (e) { return e.categoria !== "talento"; })) +
        secao("Talentos de Origem", grupo("Origem")) +
        secao("Talentos Gerais", grupo("Geral")) +
        secao("Estilos de Luta", grupo("Estilo de Luta")) +
        secao("Dádivas Épicas", grupo("Dádiva Épica")) +
        secao("Eberron · Dracossinais", te.filter(marca)) +
        secao("Eberron · Outros talentos", te.filter(function (e) { return !marca(e); }));
    } else if (estado.aba === "equipamento") {
      var eqs = porCapitulo("equipamento").sort(ordenarPadrao);
      var g = function (x) { return eqs.filter(function (e) { return (e.sub_curto || "") === x; }); };
      html = '<header class="cap-cab"><span class="cap-num">Capítulo 6</span><h2>Equipamento</h2></header>' +
        secao("Regras e tabelas", g("Regras")) +
        secao("Propriedades de armas", g("Propriedade")) +
        secao("Propriedades de maestria", g("Maestria")) +
        secao("Ferramentas", g("Ferramentas")) +
        secao("Itens com regras", g("Item")) +
        secao("Montarias, serviços e itens mágicos", g("")) +
        secao("Eberron · Itens mágicos", g("Item mágico"));
    } else if (estado.aba === "criacao") {
      html = '<header class="cap-cab"><span class="cap-num">Capítulo 2</span><h2>Criação de Personagens</h2></header>' +
        secao("Criação e avanço", porCapitulo("criacao").sort(ordenarPadrao));
    } else if (estado.aba === "apendices") {
      var ap = porCapitulo("apendices").sort(ordenarPadrao);
      html = '<header class="cap-cab"><span class="cap-num">Apêndices A e B</span><h2>Multiverso e Criaturas</h2></header>' +
        secao("O Multiverso", ap.filter(function (e) { return e.id.indexOf("multiverso") === 0; })) +
        secao("Como ler as estatísticas", ap.filter(function (e) { return e.categoria === "regra" && e.id.indexOf("multiverso") !== 0; })) +
        secao("Criaturas do Livro do Jogador", ap.filter(function (e) { return e.categoria === "criatura" && e.livro !== "mm"; })) +
        secao("Animais do Livro dos Monstros", ap.filter(function (e) { return e.livro === "mm"; }));
    } else if (estado.aba === "glossario") {
      var gl = porCapitulo("glossario").sort(function (a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); });
      html = '<header class="cap-cab"><span class="cap-num">Apêndice C</span><h2>Glossário de Regras</h2></header>' +
        '<p class="vazio" style="text-align:left">Condições, ações e as demais regras já estão nos capítulos; a busca encontra todas.</p>' +
        secao("Verbetes", gl);
    } else if (estado.aba === "magias") {
      var todasM = porCapitulo("magias").sort(ordenarPadrao);
      var regrasM = todasM.filter(function (e) { return e.categoria !== "magia"; });
      var fc = estado.filtroClasse || "";
      var magias = todasM.filter(function (e) { return e.categoria === "magia" && (!fc || e.magia.classes.indexOf(fc) >= 0); });
      var CLS = ["Artífice", "Bardo", "Bruxo", "Clérigo", "Druida", "Feiticeiro", "Guardião", "Mago", "Paladino"];
      var niveis = [];
      magias.forEach(function (m) { if (niveis.indexOf(m.magia.nivel) < 0) niveis.push(m.magia.nivel); });
      html = '<header class="cap-cab"><span class="cap-num">Capítulo 7</span><h2>Magias</h2></header>' +
        secao("Regras de conjuração", regrasM) +
        '<div class="chips filtro-classe">' + chip("", "Todas", !fc, undefined, "data-classe-f") +
        CLS.map(function (c) { return chip(c, c, fc === c, undefined, "data-classe-f"); }).join("") + "</div>" +
        niveis.map(function (n) {
          return secao(n === 0 ? "Truques" : n + "º círculo", magias.filter(function (m) { return m.magia.nivel === n; }));
        }).join("");
    } else {
      var favs = favoritos.map(function (id) { return estado.porId[id]; }).filter(Boolean);
      html = '<header class="cap-cab"><span class="cap-num">Seus</span><h2>Favoritos</h2></header>' +
        (favs.length ? '<ul class="lista">' + favs.map(itemLista).join("") + "</ul>"
                     : '<p class="vazio">Nenhum favorito ainda. Abra uma regra e toque na estrela para guardá-la aqui.</p>');
    }
    app.innerHTML = '<div class="vista">' + html + "</div>";
  }

  // Características escritas por extenso dentro da ficha da classe ou subclasse
  function blocoCarac(f) {
    return '<section class="carac" id="c-' + f.id + '">' +
      '<h3 class="carac-titulo"><span class="carac-nivel">Nível ' + (f.nivel || "") + '</span>' +
      '<a href="#' + f.id + '">' + esc(f.nome) + "</a></h3>" +
      '<div class="carac-corpo">' + formatar(f.texto, true) + "</div></section>";
  }

  function blocoOpcoes(lista) {
    var grupos = {};
    lista.forEach(function (f) { (grupos[f.sub_curto] = grupos[f.sub_curto] || []).push(f); });
    return Object.keys(grupos).map(function (g) {
      var itens = grupos[g].sort(function (a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); });
      return '<details class="opcoes"><summary>' + esc(NOMES_OPCOES[g] || g) + ' <span class="n">' + itens.length + "</span></summary>" +
        itens.map(function (f) {
          return '<section class="opcao" id="c-' + f.id + '"><h4><a href="#' + f.id + '">' + esc(f.nome) + "</a></h4>" + formatar(f.texto, true) + "</section>";
        }).join("") + "</details>";
    }).join("");
  }

  function porNivel(a, b) { return (a.nivel || 0) - (b.nivel || 0) || a.nome.localeCompare(b.nome, "pt-BR"); }

  function corpoClasse(e) {
    var texto = String(e.texto || "");
    if (!e.de) {
      // Ficha da classe: troca a lista de links pelas características completas
      var iCar = texto.indexOf("### Características"), iSub = texto.indexOf("### Subclasses");
      var antes = iCar >= 0 ? texto.slice(0, iCar) : texto;
      var subs = iSub >= 0 ? texto.slice(iSub) : "";
      var feats = estado.entradas.filter(function (f) { return f.de === e.id && !f.subclasse && f.tipo !== "subclasse"; });
      var nucleo = feats.filter(function (f) { return !f.sub_curto; }).sort(porNivel);
      var opcoes = feats.filter(function (f) { return f.sub_curto; });
      return formatar(antes) +
        '<h3>Características da classe</h3>' + nucleo.map(blocoCarac).join("") + blocoOpcoes(opcoes) +
        formatar(subs);
    }
    // Ficha da subclasse: introdução + todas as características por nível
    var corte = texto.indexOf("\n\n- **Nível");
    var intro = corte >= 0 ? texto.slice(0, corte) : texto;
    var todas = estado.entradas.filter(function (f) { return f.subclasse === e.subclasse && f.tipo !== "subclasse" && f.de === e.de; });
    var proprias = todas.filter(function (f) { return !f.sub_curto || f.sub_curto === e.sub_curto; }).sort(porNivel);
    var opcoesS = todas.filter(function (f) { return f.sub_curto && f.sub_curto !== e.sub_curto; });
    var classe = estado.porId[e.de];
    return formatar(intro) + proprias.map(blocoCarac).join("") + blocoOpcoes(opcoesS) +
      (classe ? '<p class="volta-classe">Classe: <a class="ref" href="#' + classe.id + '">' + esc(classe.nome) + "</a></p>" : "");
  }

  function vistaFicha(e) {
    var cat = CATEGORIAS[e.categoria] || CATEGORIAS.regra;
    var fav = favoritos.indexOf(e.id) >= 0;
    var bloco = "";
    if (e.magia) {
      var m = e.magia;
      var campos = [
        ["Círculo", rotuloNivel(m.nivel)],
        ["Escola", m.escola],
        ["Tempo de conjuração", m.tempo, m.tempo && m.tempo.length > 24],
        ["Alcance", m.alcance],
        ["Componentes", m.componentes, m.componentes && m.componentes.length > 18],
        ["Duração", m.duracao, m.duracao && m.duracao.length > 18],
        ["Classes", (m.classes || []).join(", "), true]
      ].filter(function (c) { return c[1]; });
      // campos longos ocupam a linha inteira
      bloco = '<dl class="bloco-magia">' + campos.map(function (c) {
        return (c[2] ? '<div class="largo">' : "<div>") + "<dt>" + esc(c[0]) + "</dt><dd>" + esc(c[1]) + "</dd></div>";
      }).join("") + "</dl>";
    }

    var saindo = e._refs.filter(function (id) { return estado.porId[id] && id !== e.id; });
    var chegando = estado.entradas.filter(function (o) { return o.id !== e.id && o._refs.indexOf(e.id) >= 0 && saindo.indexOf(o.id) < 0; })
      .map(function (o) { return o.id; });
    var rel = saindo.concat(chegando);
    if (e.categoria === "classe" && (!e.de || e.tipo === "subclasse")) rel = []; // a ficha já lista tudo
    var pai = e.de && e.tipo !== "subclasse" ? (e.subclasse ? estado.entradas.filter(function (s) { return s.tipo === "subclasse" && s.subclasse === e.subclasse && s.de === e.de; })[0] : estado.porId[e.de]) : null;
    if (pai) rel = [pai.id].concat(rel.filter(function (id) { return id !== pai.id; }));
    var relacionados = rel.length
      ? '<section class="relacionados"><h3>Veja também</h3><div>' +
        rel.map(function (id) { var o = estado.porId[id]; return '<a class="chip" href="#' + id + '">' + esc(o.nome) + "</a>"; }).join("") +
        "</div></section>"
      : "";

    app.innerHTML = '<article class="vista" style="--cor:' + cat.cor + '">' +
      '<button type="button" class="voltar" id="voltar">← Voltar</button>' +
      (iconeClasse(e) ? '<header class="ficha-cab com-icone"><span class="ficha-icone">' + iconeClasse(e) + "</span><div>" : '<header class="ficha-cab"><div>') +
      '<div class="ficha-cat">' + esc(rotuloFicha(e, cat)) + "</div>" +
      "<h2>" + esc(e.nome) + "</h2>" +
      (e.nome_en ? '<div class="ficha-en">' + esc(e.nome_en) + "</div>" : "") +
      '</div><button type="button" class="favoritar" id="favoritar" aria-pressed="' + fav + '" aria-label="' + (fav ? "Remover dos favoritos" : "Adicionar aos favoritos") + '">' + (fav ? "★" : "☆") + "</button></header>" +
      bloco +
      '<div class="corpo">' + (e.categoria === "classe" && (!e.de || e.tipo === "subclasse") ? corpoClasse(e) : formatar(e.texto)) + "</div>" +
      relacionados +
      '<p class="fonte-ficha">Fonte: ' + esc(e.fonte || FONTE_PADRAO) + ".</p>" +
      "</article>";
  }

  function vistaSobre() {
    app.innerHTML = '<section class="vista sobre">' +
      '<button type="button" class="voltar" id="voltar">← Voltar</button>' +
      "<h2>Sobre</h2>" +
      "<p>O Grimório de Mesa reúne regras de Dungeons &amp; Dragons (edição 2024) para consulta rápida durante o jogo. O conteúdo é atualizado pelo narrador e chega automaticamente quando o app é aberto com internet. Sem internet, o app mostra a última versão baixada.</p>" +
      "<p>Versão do conteúdo: <strong>" + esc(estado.versao || "—") + "</strong>.</p>" +
      '<p class="licenca">Este trabalho inclui material do System Reference Document 5.2 (“SRD 5.2”) da Wizards of the Coast LLC, disponível em <a href="https://www.dndbeyond.com/srd" target="_blank" rel="noopener">dndbeyond.com/srd</a>. O SRD 5.2 é licenciado sob a Licença Creative Commons Atribuição 4.0 Internacional, disponível em <a href="https://creativecommons.org/licenses/by/4.0/legalcode" target="_blank" rel="noopener">creativecommons.org/licenses/by/4.0/legalcode</a>. O texto foi traduzido e adaptado para o português.</p>' +
      '<p class="licenca">Ícones das classes: <a href="https://game-icons.net" target="_blank" rel="noopener">game-icons.net</a>, de Lorc e Delapouite, sob a licença <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener">CC BY 3.0</a>.</p>' +
      '<p class="licenca">Algumas entradas trazem um resumo das regras do Livro do Jogador (2024) escrito com outras palavras, para consulta da mesa. A fonte de cada entrada aparece no fim da ficha.</p>' +
      "</section>";
  }

  /* ---------- roteamento ---------- */
  function rotaAtual() { return decodeURIComponent((location.hash || "").replace(/^#/, "")); }

  function renderizar() {
    if (!estado.entradas.length) return;
    var rota = rotaAtual();
    if (rota === "sobre") { vistaSobre(); window.scrollTo(0, 0); return; }
    var e = estado.porId[rota];
    if (e) { estado.aba = capitulo(e); renderAbas(); vistaFicha(e); window.scrollTo(0, 0); return; }
    vistaLista();
    window.scrollTo(0, estado.scrollLista);
  }

  window.addEventListener("hashchange", function (ev) {
    var anterior = (ev.oldURL || "").split("#")[1] || "";
    estado.veioDaLista = !estado.porId[anterior] && anterior !== "sobre";
    renderizar();
  });

  /* ---------- interações ---------- */
  app.addEventListener("click", function (ev) {
    var alvo = ev.target.closest("button, a");
    if (!alvo) return;

    if (alvo.matches(".item") || (alvo.matches("a") && rotaAtual() === "")) {
      estado.scrollLista = window.scrollY;
    }
    if (alvo.hasAttribute("data-classe-f")) {
      estado.filtroClasse = alvo.getAttribute("data-classe-f");
      try { localStorage.setItem("grimorio:classe-magias", estado.filtroClasse); } catch (e) {}
      vistaLista();
      return;
    }
    if (alvo.id === "voltar") {
      if (estado.veioDaLista && history.length > 1) history.back();
      else location.hash = "";
      return;
    }
    if (alvo.id === "favoritar") {
      var id = rotaAtual();
      var i = favoritos.indexOf(id);
      if (i >= 0) favoritos.splice(i, 1); else favoritos.push(id);
      gravar("grimorio:favoritos", favoritos);
      vistaFicha(estado.porId[id]);
      return;
    }
  });

  document.getElementById("abas").addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-aba]");
    if (!b) return;
    estado.aba = b.getAttribute("data-aba");
    gravar("grimorio:aba", estado.aba);
    estado.scrollLista = 0;
    if (estado.busca) { campoBusca.value = ""; estado.busca = ""; botaoLimpar.hidden = true; }
    if (rotaAtual() !== "") location.hash = ""; else { vistaLista(); window.scrollTo(0, 0); }
  });

  campoBusca.addEventListener("input", function () {
    estado.busca = campoBusca.value;
    botaoLimpar.hidden = !campoBusca.value;
    estado.scrollLista = 0;
    if (rotaAtual() !== "") { location.hash = ""; } else { vistaLista(); window.scrollTo(0, 0); }
  });
  campoBusca.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") { campoBusca.value = ""; campoBusca.dispatchEvent(new Event("input")); }
    if (ev.key === "Enter" && estado.busca.trim()) {
      var r = resultados();
      if (r.length) { campoBusca.blur(); location.hash = r[0].id; }
    }
  });
  botaoLimpar.addEventListener("click", function () {
    campoBusca.value = ""; campoBusca.dispatchEvent(new Event("input")); campoBusca.focus();
  });
  document.getElementById("link-inicio").addEventListener("click", function (ev) {
    ev.preventDefault();
    estado.scrollLista = 0;
    if (rotaAtual() !== "") location.hash = ""; else { vistaLista(); window.scrollTo(0, 0); }
  });

  /* ---------- aviso ---------- */
  var aviso = document.getElementById("aviso");
  var avisoTexto = document.getElementById("aviso-texto");
  var avisoAcao = document.getElementById("aviso-acao");
  var acaoAtual = null;
  function avisar(texto, rotuloAcao, acao) {
    avisoTexto.textContent = texto;
    acaoAtual = acao || null;
    avisoAcao.hidden = !acao;
    if (rotuloAcao) avisoAcao.textContent = rotuloAcao;
    aviso.hidden = false;
    if (!acao) setTimeout(function () { aviso.hidden = true; }, 6000);
  }
  avisoAcao.addEventListener("click", function () { aviso.hidden = true; if (acaoAtual) acaoAtual(); });
  document.getElementById("aviso-fechar").addEventListener("click", function () { aviso.hidden = true; });

  /* ---------- carregamento do conteúdo ---------- */
  function buscarJSON(caminho) {
    return fetch(caminho, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(caminho + ": " + r.status);
      return r.json();
    });
  }

  function carregar(silencioso) {
    return buscarJSON("index.json").then(function (indice) {
      if (silencioso && indice.versao === estado.versao) return;
      return Promise.all(indice.arquivos.map(function (a) { return buscarJSON(a); })).then(function (partes) {
        var entradas = [];
        partes.forEach(function (p) { entradas = entradas.concat(p); });
        entradas.forEach(prepararIndice);
        estado.entradas = entradas;
        estado.porId = {};
        entradas.forEach(function (e) { estado.porId[e.id] = e; });
        estado.versao = indice.versao;
        estado.ultimaCarga = Date.now();
        document.getElementById("versao").textContent = "Conteúdo " + indice.versao;

        var vista = ler("grimorio:versao", null);
        if (vista && vista !== indice.versao) {
          avisar("Conteúdo atualizado. " + (indice.notas || ""));
        }
        gravar("grimorio:versao", indice.versao);
        renderizar();
      });
    }).catch(function (erro) {
      if (silencioso) return;
      app.innerHTML = '<p class="vazio">Não foi possível carregar o conteúdo. Conecte-se à internet e abra o app de novo para baixar a primeira versão.</p>';
      console.error(erro);
    });
  }

  var abaSalva = ler("grimorio:aba", "jogo");
  if (ABAS.some(function (a) { return a.id === abaSalva; })) estado.aba = abaSalva;
  carregar(false);

  // Ao voltar para o app depois de um tempo, verifica se há conteúdo novo
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && Date.now() - estado.ultimaCarga > 10 * 60 * 1000) {
      carregar(true);
      if (registro) { try { registro.update(); } catch (e) { /* ignora */ } }
    }
  });

  /* ---------- funcionamento offline e atualização do app ---------- */
  var registro = null;
  if ("serviceWorker" in navigator) {
    try {
      navigator.serviceWorker.register("sw.js").then(function (reg) {
        registro = reg;
        reg.addEventListener("updatefound", function () {
          var novo = reg.installing;
          if (!novo) return;
          novo.addEventListener("statechange", function () {
            if (novo.state === "installed" && navigator.serviceWorker.controller) {
              avisar("Nova versão do app disponível.", "Atualizar", function () { novo.postMessage("pular-espera"); });
            }
          });
        });
      }).catch(function () { /* sem offline neste ambiente */ });
      var recarregou = false;
      navigator.serviceWorker.addEventListener("controllerchange", function () {
        if (recarregou) return;
        recarregou = true;
        location.reload();
      });
    } catch (e) { /* sem offline neste ambiente */ }
  }
})();
