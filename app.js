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
    barbaro: "M197.584 23.28c-18.284.166-34.4 4.378-48.488 12.285C120.92 51.38 102.008 80.7 87.62 117.445c-.637 1.623-1.254 3.282-1.874 4.936a433.13 433.13 0 0 0 16.73 6.654c.628-1.69 1.26-3.378 1.905-5.028 13.612-34.757 30.7-59.935 53.524-72.746 11.413-6.405 24.546-10.037 40.137-10.136 15.592-.1 33.64 3.335 54.884 11.06L256 53.3l3.076-1.116c42.486-15.45 72.195-13.735 95.02-.924 22.824 12.81 39.912 37.99 53.523 72.746.645 1.65 1.276 3.338 1.905 5.028a433.14 433.14 0 0 0 16.73-6.653c-.62-1.653-1.238-3.312-1.874-4.936-14.388-36.743-33.3-66.065-61.476-81.88C335.38 20.117 300.046 18.895 256 34.27c-21.502-7.506-40.977-11.15-58.416-10.99zm-16.145 85.35c-4.77 5.446-9.19 11.48-13.268 18.068-3.655 5.905-7 12.262-10.037 19.01l.16.035c.235-.005.47-.018.705-.018a32.61 32.61 0 0 1 13.77 3.05 439.41 439.41 0 0 0 49.494 6.62c-15.17-15.56-29.05-32.14-40.825-46.764zm157.474 10.652c-9.547 9.597-17.313 20.762-23.076 33.34a438.226 438.226 0 0 0 23.387-3.846 32.61 32.61 0 0 1 13.775-3.05c.236 0 .47.012.705.017l.16-.035c-3.036-6.748-6.382-13.105-10.037-19.01a147.53 147.53 0 0 0-4.914-7.416zM37.727 138.725l22.34 22.34 7.445-22.34zm406.76 0l7.447 22.34 22.34-22.34zM85.526 141.61l-10.187 30.564c17.367 6.233 34.72 11.564 52.062 16.002-.906-3-1.4-6.17-1.4-9.45 0-7.88 2.816-15.144 7.486-20.84a453.046 453.046 0 0 1-47.96-16.276zm340.95 0a452.977 452.977 0 0 1-47.967 16.267c4.673 5.7 7.492 12.966 7.492 20.848 0 3.276-.492 6.444-1.396 9.44a579.07 579.07 0 0 0 52.058-15.99zM159 163.725c-8.39 0-15 6.61-15 15s6.61 15 15 15 15-6.61 15-15-6.61-15-15-15zm194 0c-8.39 0-15 6.61-15 15s6.61 15 15 15 15-6.61 15-15-6.61-15-15-15zm-31.78 6.184a454.296 454.296 0 0 1-12.21 1.585c-2.643 9.64-4.27 19.926-4.8 30.808a509.808 509.808 0 0 0 23.265-2.752c-4.663-5.694-7.475-12.953-7.475-20.825 0-3.05.43-6.005 1.22-8.816zm-130.433.014a32.614 32.614 0 0 1 1.213 8.8c0 7.875-2.813 15.136-7.48 20.83a510.61 510.61 0 0 0 34.617 3.73c.32-6.48-3.405-30.475-3.405-30.475a456.76 456.76 0 0 1-24.945-2.886zm51.604 4.64l-8.644 6.897 13.88 83.265h16.75L275.4 198.57c-11.192-6.3-22.285-14.618-33.01-24.007zM66.28 188.16c-15.22 63.397-26.077 137.993-43.05 211.542l-1.8 7.804 7.543 2.696a14845.52 14845.52 0 0 0 43.41 15.453 417.662 417.662 0 0 1 12.77-4.47c5.114-1.703 10.176-3.32 15.11-4.903-17.488-6.054-36.565-12.83-57.777-20.403C58.5 324.755 69.37 253.65 83.47 194.134a613.683 613.683 0 0 1-17.19-5.974zm379.44 0a613.688 613.688 0 0 1-17.19 5.975c14.1 59.517 24.97 130.62 40.984 201.744-21.212 7.57-40.29 14.348-57.776 20.402 4.933 1.582 9.995 3.2 15.108 4.904a417.657 417.657 0 0 1 12.77 4.47c13.545-4.79 27.904-9.916 43.41-15.454l7.544-2.696-1.8-7.804c-16.973-73.55-27.83-148.145-43.05-211.54zm-305.408 21.694c-2.188 15.23-3.312 31.277-3.312 47.87 0 48 .646 86.742 14.814 111.536 7.085 12.397 17.22 21.812 33.647 28.657 16.428 6.844 39.29 10.808 70.54 10.808 31.25 0 54.112-3.964 70.54-10.808 16.426-6.845 26.56-16.26 33.646-28.657C374.354 344.466 375 305.725 375 257.725c0-16.594-1.124-32.64-3.313-47.87-27.274 6.046-54.568 9.943-81.87 11.71l-2.413 14.484c21.605 2.345 46.537-6.993 77.395-18.737l6.4 16.824c-7.816 2.975-15.448 5.92-22.948 8.63 4.365 3.607 7.7 8.663 7.7 14.958 0 8.2-5.652 14.307-11.88 17.834-6.228 3.526-13.82 5.31-22.095 5.31-8.275 0-15.868-1.784-22.096-5.31-6.227-3.528-11.88-9.635-11.88-17.835 0-1.182.13-2.316.35-3.41a79.073 79.073 0 0 1-3.92-.416l-4.805 28.825h-47.25L227.57 253.9c-1.305.168-2.612.31-3.92.415.22 1.094.35 2.228.35 3.41 0 8.2-5.653 14.307-11.88 17.834-6.23 3.526-13.822 5.31-22.097 5.31-8.274 0-15.867-1.784-22.095-5.31-6.228-3.528-11.88-9.635-11.88-17.835 0-6.295 3.335-11.35 7.7-14.96-7.5-2.707-15.132-5.653-22.95-8.628l6.403-16.824c30.86 11.744 55.79 21.082 77.396 18.736l-2.414-14.485c-27.3-1.767-54.595-5.664-81.87-11.71zm-36.177 6.512c-.22.01-.53.215-.754.254-9.218 30.762-5.474 47.118.24 66.853l15.38 7.69v-62.618c-4.425-6.463-8.398-9.97-11.084-11.224-1.486-.692-2.616-1.015-3.78-.954zm303.73 0c-1.165-.06-2.295.262-3.78.955-2.687 1.254-6.66 4.762-11.085 11.225v62.618l15.38-7.69c5.715-19.735 9.458-36.09.24-66.853-.226-.04-.535-.243-.755-.254zM190.023 252.58c-5.52 0-10.413 1.38-13.224 2.973-2.023 1.145-2.54 1.945-2.68 2.172.14.227.657 1.027 2.68 2.172 2.81 1.592 7.704 2.973 13.223 2.973 5.52 0 10.415-1.38 13.227-2.973 2.022-1.145 2.538-1.945 2.68-2.172-.142-.227-.658-1.027-2.68-2.172-2.812-1.592-7.707-2.972-13.227-2.972zm15.907 5.145c.055.09.07.11.07 0s-.015-.09-.07 0zm-31.81 0c-.056-.09-.07-.11-.07 0s.014.09.07 0zm147.857-5.144c-5.52 0-10.415 1.38-13.227 2.973-2.022 1.145-2.538 1.945-2.68 2.172.142.227.658 1.027 2.68 2.172 2.812 1.592 7.707 2.973 13.227 2.973 5.52 0 10.413-1.38 13.224-2.973 2.023-1.145 2.54-1.945 2.68-2.172-.14-.227-.657-1.027-2.68-2.172-2.81-1.592-7.704-2.972-13.223-2.972zm15.904 5.145c.056.09.07.11.07 0s-.014-.09-.07 0zm-31.81 0c-.055-.09-.07-.11-.07 0s.015.09.07 0zm-91.07 32h18s.124 6.12 3.05 11.975c2.927 5.853 6.95 11.025 19.95 11.025s17.023-5.172 19.95-11.025c2.926-5.854 3.05-11.975 3.05-11.975h18s.124 9.88-4.95 20.026c-5.073 10.147-17.05 20.975-36.05 20.975-19 0-30.977-10.828-36.05-20.974-5.074-10.146-4.95-20.025-4.95-20.025zm41 53.178c21.138 0 42.276 4.093 66.846 12.283l-5.692 17.078c-46.86-15.62-75.447-15.62-122.308 0l-5.692-17.078c24.57-8.19 45.708-12.283 66.846-12.283zm-94.244 62.674a30.333 30.333 0 0 1-1.297 1.53c-5.123 5.61-11.71 9.69-19.056 13.228-14.692 7.073-32.843 12.024-50.558 17.93-17.716 5.904-34.85 12.754-46.82 22.064-9.73 7.565-16.135 16.173-18.22 28.395H173.81c12.59-6.51 23.538-11.936 30.553-17.66 7.39-6.03 10.754-11.19 10.635-21.232l18-.215c.18 15.237-7.198 27.185-17.256 35.392a81.47 81.47 0 0 1-4.953 3.715h90.42a81.47 81.47 0 0 1-4.954-3.715c-10.058-8.207-17.436-20.155-17.256-35.392l18 .215c-.12 10.042 3.246 15.203 10.635 21.232 7.015 5.724 17.962 11.15 30.553 17.66h148.007c-2.086-12.222-8.492-20.83-18.22-28.396-11.97-9.31-29.105-16.16-46.82-22.066-17.716-5.905-35.867-10.856-50.56-17.93-7.345-3.536-13.932-7.618-19.054-13.228-.45-.493-.878-1.006-1.296-1.53-5.047 3.394-10.633 6.395-16.783 8.958-19.572 8.155-44.71 12.19-77.46 12.19-32.75 0-57.888-4.035-77.46-12.19-6.15-2.563-11.737-5.564-16.784-8.957z",
    bardo: "M108.656 35.063c-15.053.138-33.413 5.378-46.97 15.812-10.75 8.276-18.777 19.27-21.186 34.438.21-.126.414-.252.625-.376-.843 2.816-1.313 5.786-1.313 8.876 0 17.087 13.85 30.937 30.938 30.937 14.293 0 26.324-9.705 29.875-22.875.028-.115.067-.23.094-.344.48-2.082.768-4.042.905-5.843.025-.327.017-.65.03-.968.005-.126.03-.25.032-.376.007-.182-.002-.353 0-.53 0-1.526-.098-3.036-.312-4.5-1.367-8.018-6.778-12.156-12.594-13.72-8.527-2.293-19.055.637-23.75 18.156l-.468-.125C62.04 74.12 72.213 63.885 83.94 60.78c2.476-.654 5.053-1.005 7.656-.968 9.072.13 18.445 4.88 24.562 17.126.087.173.165.355.25.53 5.208 15.233 2.11 43.32-3.344 57.626-7.288 18.753-22.376 40.504-47.687 65.5C6.99 258.252 4 329.824 39.97 388.814 75.936 447.8 152.13 493.56 254.437 493.56c102.306 0 178.47-45.76 214.437-104.75 35.882-58.848 32.982-130.225-25-187.812l-.406-.406h-.033c-25.31-24.996-40.367-46.747-47.656-65.5-5.23-16.453-9.09-42.988-2.655-57.625.058-.128.128-.25.188-.376.025-.05.037-.106.062-.156 6.117-12.246 15.49-16.996 24.563-17.126 2.602-.037 5.18.314 7.656.97 11.724 3.102 21.87 13.337 19.344 32.843l-.438.125c-4.694-17.52-15.222-20.45-23.75-18.156-4.41 1.185-8.603 3.85-10.97 8.562-.012.04-.017.085-.03.125-.975 3.007-1.5 6.203-1.5 9.532 0 17.088 13.85 30.938 30.938 30.938 17.087 0 30.937-13.85 30.937-30.938 0-4.355-.907-8.49-2.53-12.25-3.058-13.244-10.598-23.112-20.44-30.687-14.458-11.13-34.39-16.363-49.936-15.78-13.378.5-24.85 4.108-33.22 10.53-3.412 2.617-6.383 5.702-8.844 9.375-69.455 35.508-138.89 38.75-208.344-7.75-.642-.557-1.29-1.105-1.968-1.625-8.37-6.422-19.843-10.03-33.22-10.53-.97-.037-1.964-.042-2.968-.032zm52.78 53.124c6.338 2.648 12.666 4.987 19 7.032v313.06c-30.732-8.258-57.886-22.005-77.374-41.31-17.1-16.94-28.077-38.626-28.906-63.595-.828-24.97 8.274-52.702 28.97-82.625 41.323-59.752 57.163-103.6 58.31-132.563zm186.033 1.407c1.6 28.97 17.593 72.37 58.25 131.156 20.693 29.923 29.796 57.656 28.967 82.625-.828 24.97-11.807 46.654-28.906 63.594-19.023 18.846-45.374 32.4-75.217 40.717V94.844c5.636-1.606 11.27-3.35 16.906-5.25zm-35.595 10v312.53c-8.21 1.63-16.606 2.878-25.125 3.782V104.094c8.376-1.122 16.75-2.63 25.125-4.5zm-112.75.78c8.45 1.97 16.894 3.442 25.344 4.44v311.342c-8.59-.84-17.057-2.05-25.345-3.625V100.376zm68.938 5.564v311.375c-4.54.198-9.088.312-13.657.312-3.76 0-7.506-.053-11.25-.188V106.28c8.293.314 16.614.18 24.906-.343z",
    bruxo: "M256 16l-32 112 32 32 32-32-32-112zM64 96l32 80 64 16-96-96zm384 0l-96 96 64-16 32-80zm-192 80l-64 48-128 32c80 16 128 96 192 128 64-32 112.476-110.213 192-128l-128-28.31L256 176zm-39.512 52.682l28.342 8.863-7.45 20.955L256 310.895l18.62-52.395-7.45-20.955 28.342-8.863c14.923 10.97 24.488 28.03 24.488 47.283C320 309.237 291.47 336 256 336s-64-26.763-64-60.035c0-19.254 9.565-36.314 24.488-47.283zM96 336l-64 48-16 64 32-32 64-48s-16-27.61-16-32zm320 0l-16 32 64 48 32 32-16-64-64-48zm-272 64l-16 64 48-48-32-16zm112 0l-48 16 48 80 48-80-48-16zm112 0l-32 16 48 48-16-64z",
    clerigo: "M257.47 23.406c-66.354 0-120.158 53.415-120.158 119.313 0 18.87 4.427 36.7 12.282 52.56h-.094l1.938 3.564c.212.395.408.795.625 1.187l45.343 84.19-89.53-47.595v214.5l61.343-32.625 77.405-162.125c-17.123-32.793-48.563-96.2-48.563-119.938 0-32.592 26.59-59 59.407-59 32.816 0 59.436 26.41 59.436 59 0 30.663-51.987 126.665-58.22 138.063L196.97 403.78l.436-.25-2.906 5.376-39.875 83.563h210.813l-47.907-88.94 89.564 47.595v-214.5l-61.688 32.78-96.594 166.658h41.907v18.687h-74.346l8.126-14.03 122.72-211.626 15.874-29.5 2.344-4.313h-.094c7.85-15.86 12.25-33.694 12.25-52.56 0-65.896-53.772-119.314-120.125-119.314zm0 72.78c-22.19 0-39.908 17.658-39.908 39.595 0 21.94 17.717 39.564 39.907 39.564 22.19 0 39.936-17.625 39.936-39.563 0-21.936-17.747-39.593-39.937-39.593z",
    druida: "M92.239 26.432c-4.705.09-9.496.87-14.37 2.473-19.773 6.506-41.557 59.364-7.411 112.912 9.221 14.46-41 39.289-31.803 67.056 12.387 37.399 99.437 19.933 112.104 42.211 6.44 11.328-79.773 49.284-49.663 81.625 37.951 40.763 76.062 14.109 138.553 23.864 24.685 3.853-26.357 63.343 11.031 86.498 39.948 24.739 118.742 1.986 160.846-20.254a20577.214 20577.214 0 0 0-30.19-36.098c-33.45 10.371-71.807 15.824-106.036 13.664 36.092-6.615 65.118-14.246 94.8-27.025-21.566-25.637-43.299-51.22-65.357-76.479-36.846 7.379-103.783 18.406-166.793 13.88 8.83-1.316 110.772-14.937 154.935-27.38a3177.953 3177.953 0 0 0-24.357-27.318 6823.337 6823.337 0 0 0-27.935-35.486 6485.7 6485.7 0 0 0-15.413-19.34l-.115.658c-31.187 1.8-90.154 3.052-142.9-10.709 7.477.02 92.983 1.716 132.031-3.637-16.65-20.699-32.746-40.434-46.473-56.795-7.035-8.385-13.392-15.81-19.011-22.209l.05-.056c25.401 23.275 50.132 47.542 74.329 72.506 15.57-24.254 32.931-56.653 41.664-80.655 1.469 29.363-15.963 66.66-27.586 95.325 22.456 23.61 44.458 47.79 66.125 72.287 20.118-23.976 44.105-60.316 54.869-83.707-3.957 26.047-31.834 67.188-44.936 94.982 25.142 28.669 49.84 57.727 74.266 86.8 13.506-17.48 28.29-40.286 35.822-57.296 1.32 21.671-14.607 49.312-24.892 70.281l-.05-.014c9.624 11.49 19.211 22.974 28.766 34.428 3.016-2.12 5.604-4.173 7.582-6.095 31.459-30.573 36.26-79.699 17.842-116.51-12.519-25.021-70.096-8.654-77.265-23.846-9.068-19.214 51.563-76.204 28.146-104.902-16.456-20.168-75.04 1.983-85.264-16.182-16.343-29.04 28.13-74.832-21.763-99.244-26.468-12.95-46.397 5.349-88.338 44.103-21.236 19.623-62.13-63.165-113.828-64.312a48.694 48.694 0 0 0-2.012-.004zm345.39 402.365l-13.982 11.336 36.848 45.444 13.98-11.336-36.845-45.444z",
    feiticeiro: "M247.79 18.734C137.967 17.596 19.874 96.94 19.73 244.53l21.403-51.395c-9.485 72.28-7.75 147.236 38.79 202.502L38.2 377.355c39.24 69.774 126.333 90.976 200.855 92.51C124.11 429.9 67.87 342.277 63.912 246.492c-6.722-211.78 260.658-217.694 340.78-75.77-3.417-19.492-8.623-38.426-15.618-56.11 77.406 89.155 59.293 214.875-21.29 253.036-24.25 3.95-48.93 12.06-60.954 19-58.548 33.802-6.27 126.536 53.225 92.188 9.44-5.45 23.404-17.303 36.494-31.352 64.36-59.52 98.1-118.24 93.108-188.94-6.52 29.1-19.175 57.904-35.623 84.683 63.158-146.822 7.956-263.89-144.838-301.354 12.097 5.835 23.503 13.63 33.873 23.36-57.415-23.752-131.123-22.62-186.884 3.505 28.066-26.2 64.776-43.73 102.2-49.642-3.52-.205-7.054-.325-10.597-.362zm-19.74 160.202l-19.843 100.566c-2.958 3.81-5.64 6.852-9.033 9.94l-25.688-49.096-22.705 11.93 31.37 60.945c4.48 11.474 10.02 20.68 15.162 28.524 28.063 42.803 64.547 35.252 95.303 9.555l87.28-48.452-12.71-22.498-66.136 36.94c-1.517-3.154-3.266-6.552-5.056-9.51l67.818-64.96-17.54-18.695-66.47 63.762c-2.356-2.318-4.238-4.527-6.765-6.54l45.084-78.085-22.733-13.127-45.864 78.297c-3.79-1.31-7.72-2.2-11.595-2.745l15.656-81.896-25.533-4.854z",
    guardiao: "M331.734 20.443a4.421 4.421 0 0 0-1.802.327c-27.736 11.543-47.295 57.495-29.899 76.671 33.52 38.946 72.835 55.573 90.147 128.434 2.607 20.15 1.218 40.094 0 60.25-17.312 72.861-56.627 89.488-90.147 128.434-17.396 19.176 2.163 65.128 29.899 76.671 9.038 3.762 28.025-26.165 21.752-25.209-16.34 2.491-37.8-20.941-28.387-28.93 38.47-32.65 105.49-100.055 100.277-135.552-2.211-15.057-9.35-30.36-15.574-45.539 6.225-15.18 13.363-30.482 15.574-45.54 5.214-35.496-61.806-102.901-100.277-135.552-9.412-7.988 12.047-31.42 28.387-28.93 5.881.897-10.44-25.35-19.95-25.535zM152 24.23l-21.441 53.602L152 99.273l21.441-21.441zm-9 91.497v296.546l9-9 9 9V115.727l-2.637 2.636-6.363 6.364zm160 9.847v260.824l18-17.53V143.104zM152 428.727l-23 23v38.546l23-23 23 23v-38.546z",
    guerreiro: "M19.75 14.438c59.538 112.29 142.51 202.35 232.28 292.718l3.626 3.75.063-.062c21.827 21.93 44.04 43.923 66.405 66.25-18.856 14.813-38.974 28.2-59.938 40.312l28.532 28.53 68.717-68.717c42.337 27.636 76.286 63.646 104.094 105.81l28.064-28.06c-42.47-27.493-79.74-60.206-106.03-103.876l68.936-68.938-28.53-28.53c-11.115 21.853-24.413 42.015-39.47 60.593-43.852-43.8-86.462-85.842-130.125-125.47-.224-.203-.432-.422-.656-.625C183.624 122.75 108.515 63.91 19.75 14.437zm471.875 0c-83.038 46.28-154.122 100.78-221.97 161.156l22.814 21.562 56.81-56.812 13.22 13.187-56.438 56.44 24.594 23.186c61.802-66.92 117.6-136.92 160.97-218.72zm-329.53 125.906l200.56 200.53c-4.36 4.443-8.84 8.793-13.405 13.032L148.875 153.53l13.22-13.186zm-76.69 113.28l-28.5 28.532 68.907 68.906c-26.29 43.673-63.53 76.414-106 103.907l28.063 28.06c27.807-42.164 61.758-78.174 104.094-105.81l68.718 68.717 28.53-28.53c-20.962-12.113-41.08-25.5-59.937-40.313 17.865-17.83 35.61-35.433 53.157-52.97l-24.843-25.655-55.47 55.467c-4.565-4.238-9.014-8.62-13.374-13.062l55.844-55.844-24.53-25.374c-18.28 17.856-36.602 36.06-55.158 54.594-15.068-18.587-28.38-38.758-39.5-60.625z",
    ladino: "M254.07 19.707c-56.303 28.998-106.297 107.317-122.64 168.707 32.445 2.11 58.63 12.963 78.638 30.848l9.334-10.198c-13.336-13.056-30.596-23.9-52.994-34.707 12.68-31.542 32.01-79.29 56.598-82.07 9.62-1.088 19.92 4.722 31.13 21.068 35.08-58.334 68.394 18.705 87.727 61.002-21.94 11.897-39.132 22.82-52.63 36.024l8.68 9.76c19.68-17.732 45.72-29.358 78.55-31.673C358.24 127.335 311.515 50.14 254.07 19.707zM219.617 144.57c-8.894 0-16.103 3.952-16.103 8.826 0 4.875 7.21 8.827 16.103 8.827 8.894 0 16.106-3.95 16.106-8.827 0-4.874-7.212-8.826-16.106-8.826zm68.965 0c-8.894 0-16.105 3.952-16.105 8.826 0 4.875 7.21 8.827 16.105 8.827 8.894 0 16.106-3.95 16.106-8.827 0-4.874-7.212-8.826-16.106-8.826zm-118.894 70.88c-2.19 3.672-4.343 7.497-6.444 11.52-25.587 48.98-43.26 123.643-43.896 223.48 32.776 18.89 64.322 31.324 95.707 36.988-35.5-24.36-60.375-80.893-60.375-146.754 0-45.97 12.12-87.39 31.51-116.506-5.098-3.372-10.583-6.29-16.502-8.727zm168.933.35c-5.852 2.477-11.27 5.412-16.298 8.764 19.24 29.095 31.254 70.354 31.254 116.12 0 65.82-24.844 122.322-60.306 146.707 30.88-5.598 62.44-17.812 95.656-36.947-.638-99.57-18.31-174.163-43.9-223.177-2.088-4.002-4.228-7.81-6.405-11.467zm-97.665 23.61c7.026 22.543 9.128 45.086.98 67.63h-41.552v18.513c10.057-3.24 20.25-5.39 30.502-6.594.066 50.215 1.313 96.574 19.82 145.435l4.193 11.074 4.485-10.962c19.48-47.615 18.045-95.297 17.933-145.024 10.257 1.333 20.463 3.4 30.545 6.07v-18.515h-41.374c-6.888-22.544-5.932-45.087.803-67.63h-26.335z",
    mago: "M256.3 19.42C204 57.2 177.2 111 152.5 160.7c43.4-24.6 101.7-32.9 126.9-28.7-63.8 10.6-108 25.8-144.4 64.3-2.2 4.5-4.1 8.3-6.4 13.1 115.4-27.8 134.4-27 250.9-.7C368 158.6 343 126.6 304 65.83 345.9 118.4 428.1 208.1 424.3 190.6 401.4 85.73 324.2 23.49 256.3 19.42zM88 231.3c-31 7.4-53.9 17.5-62.8 26.7.9 11.7 6.7 22.1 17.5 32 11.8 10.8 29.6 20.4 51.3 28.1 2.69.9 5.39 1.8 8.1 2.7-8.4-11-11.2-26.3-13-41.1 0-15.4-3-33.5-1.1-48.4zm336 0c2.2 16.2.6 34.5-1.1 48.4-1.8 14.8-4.6 30.1-13 41.1 20.2-7 44.6-17.6 59.4-30.8 10.8-9.9 16.6-20.3 17.5-32-8.9-9.2-31.7-19.3-62.8-26.7zm-274.4.3l-7 14h98.8l-7-14zm128 0l-7 14h98.8l-7-14zM119 241c-4.7 1.3-9.4 2.6-14 4.1 1 19.9.6 47.6 11.6 64.5h2.4zm274 0v68.6h2.4c10.5-20.7 11.3-41.8 11.6-64.5-4.6-1.5-9.3-2.8-14-4.1zm-255.9 22.6c-.3 18.8 2 39.5 6.2 55.7 21.1-14.1 41.9-25.7 64.7-25.7 3.2 0 6.4.2 9.4.4l5.2-15.7c-5.6 5.7-12.9 8.9-23.2 8.5-25.2-.8-33.9-11.1-37.5-23.2zm109.4 0l-12.4 37.2 21.9 27.4 21.9-27.4-12.4-37.2zm103.6 0c-3.6 12.1-12.3 22.4-37.5 23.2-10.3.4-17.6-2.8-23.2-8.5l5.2 15.7c3.1-.3 6.3-.4 9.4-.4 22.8 0 43.6 11.6 64.7 25.7 4.4-20.1 6.8-37.6 6.2-55.7zm-142.1 48c-20 0-43 14.5-68.9 32.4-19.2 13.3-39.9 28.1-63.3 38.4 28.6 6.1 65.8 4.8 98.2-2.6 21.3-4.8 40.5-12.1 53.7-20.5 8.5-5.5 14.1-11.1 17-16.4l-24.2-30.3c-3.7-.6-7.9-1-12.5-1zm96 0c-4.6 0-8.8.4-12.5 1l-24.2 30.3c2.9 5.3 8.5 10.9 17 16.4 13.2 8.4 32.4 15.7 53.7 20.5 32.4 7.4 69.6 8.7 98.2 2.6-23.4-10.3-44.1-25.1-63.3-38.4-25.9-17.9-48.9-32.4-68.9-32.4zm-48 46.7c-4.6 5.7-10.6 10.8-17.4 15.3h34.8c-6.8-4.5-12.8-9.6-17.4-15.3zm-56.7 33.3c-6.9 2.2-14 4.1-21.3 5.8-9.5 2.2-19.2 3.9-28.9 5.1 6.1 19.6 14.1 39.5 23 58.2l.1.2c4.3-6.7 9.4-13.1 13.5-19.8-2.4 13.9-3.3 27.9-2.3 41.8 1.7 3.3 3.5 6.5 5.3 9.7h134.6c3.6-6.3 7-12.7 10.3-19.2 5.4-21.9 3.9-42.8 5.4-64.2 3.1 11.5 6.1 23 8.5 34.7 5.8-13.6 11.1-27.6 15.4-41.4-9.7-1.2-19.4-2.9-28.9-5.1-7.3-1.7-14.4-3.6-21.3-5.8z",
    monge: "M263.375 19.375c-11.768 0-22.676 6.137-31.156 17.22-7.267 9.494-12.397 22.54-13.72 37.25 11.14-4.926 22.473-7.91 33.813-9V83.25c-10.965 1.377-22.008 5.008-33.157 11.03 1.968 12.487 6.703 23.502 13.063 31.814 8.48 11.082 19.387 17.22 31.155 17.22s22.707-6.138 31.188-17.22c6.167-8.06 10.783-18.667 12.843-30.688-12.07-6.832-24.194-10.997-36.406-12.344V64.75c12.676 1.087 25.22 4.516 37.344 10.188-1.155-15.158-6.336-28.614-13.78-38.344-8.482-11.082-19.42-17.22-31.19-17.22zm-46.594 117.25c-10.442 4.8-18.39 11.182-22.593 18.47l-.375-.095-41.625 64.438-50.656-21.97c-29.375-16.118-61.574 24-30.624 41.688l94.47 44.063 38.03-50.064c18.7 33.703 16.77 67.43-10.97 101.156-8.344-.642-16.37-.958-23.967-.906-40.312.278-68.942 10.254-73.907 28.78l.03.002c-4.44 16.58 10.992 36.67 39.126 55.28 55.675 29.297 95.38 38.468 156.968 42.344h1.562l.438.125c.424.026.823.07 1.25.094l-.032.314 92.063 28.72-22.19-53.72L183.595 375.5l5.875-17.72 71.81 23.845 71.845-23.844L339 375.5l-48.094 15.97 94.438 31.374c33.494-20.046 52.528-42.468 47.656-60.656-5.95-22.21-45.925-32.107-99.25-27.782-26.392-33.215-26.196-66.41-9.53-99.625L361 283.22l94.47-44.064c30.95-17.687-1.25-57.806-30.626-41.687l-50.688 21.968L332.562 155h-.062c-4.217-7.246-12.135-13.596-22.53-18.375-.2.27-.392.547-.595.813-11.268 14.725-27.633 24.562-46 24.562s-34.732-9.837-46-24.563c-.203-.265-.394-.543-.594-.812zm-63.686 311l-16.72 40.5 69.876-21.78c-17.624-4.574-34.93-10.634-53.156-18.72z",
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
      html = '<header class="cap-cab"><span class="cap-num">Capítulo 4</span><h2>Origens dos Personagens</h2></header>' +
        secao("Regras", org.filter(function (e) { return e.categoria === "regra"; })) +
        secao("Antecedentes", org.filter(function (e) { return e.categoria === "antecedente"; })) +
        secao("Espécies", org.filter(function (e) { return e.categoria === "especie"; }));
    } else if (estado.aba === "talentos") {
      var tal = porCapitulo("talentos").sort(ordenarPadrao);
      var grupo = function (g) { return tal.filter(function (e) { return e.categoria === "talento" && e.sub_curto === g; }); };
      html = '<header class="cap-cab"><span class="cap-num">Capítulo 5</span><h2>Talentos</h2></header>' +
        secao("Regras", tal.filter(function (e) { return e.categoria !== "talento"; })) +
        secao("Talentos de Origem", grupo("Origem")) +
        secao("Talentos Gerais", grupo("Geral")) +
        secao("Estilos de Luta", grupo("Estilo de Luta")) +
        secao("Dádivas Épicas", grupo("Dádiva Épica"));
    } else if (estado.aba === "equipamento") {
      var eqs = porCapitulo("equipamento").sort(ordenarPadrao);
      var g = function (x) { return eqs.filter(function (e) { return (e.sub_curto || "") === x; }); };
      html = '<header class="cap-cab"><span class="cap-num">Capítulo 6</span><h2>Equipamento</h2></header>' +
        secao("Regras e tabelas", g("Regras")) +
        secao("Propriedades de armas", g("Propriedade")) +
        secao("Propriedades de maestria", g("Maestria")) +
        secao("Ferramentas", g("Ferramentas")) +
        secao("Itens com regras", g("Item")) +
        secao("Montarias, serviços e itens mágicos", g(""));
    } else if (estado.aba === "criacao") {
      html = '<header class="cap-cab"><span class="cap-num">Capítulo 2</span><h2>Criação de Personagens</h2></header>' +
        secao("Criação e avanço", porCapitulo("criacao").sort(ordenarPadrao));
    } else if (estado.aba === "apendices") {
      var ap = porCapitulo("apendices").sort(ordenarPadrao);
      html = '<header class="cap-cab"><span class="cap-num">Apêndices A e B</span><h2>Multiverso e Criaturas</h2></header>' +
        secao("O Multiverso", ap.filter(function (e) { return e.id.indexOf("multiverso") === 0; })) +
        secao("Como ler as estatísticas", ap.filter(function (e) { return e.categoria === "regra" && e.id.indexOf("multiverso") !== 0; })) +
        secao("Criaturas", ap.filter(function (e) { return e.categoria === "criatura"; }));
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
      var CLS = ["Bardo", "Bruxo", "Clérigo", "Druida", "Feiticeiro", "Guardião", "Mago", "Paladino"];
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
