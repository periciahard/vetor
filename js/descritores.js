(function(){
 const comum={
  erros:'Leitura incompleta do comando; confusão entre conceito e procedimento; dificuldade em justificar a alternativa escolhida.',
  estrategias:'Retomada guiada do descritor, resolução modelada pelo professor, treino com itens graduados e devolutiva curta por evidência de aprendizagem.'
 };
 const lp=[
  ['D6','I. Práticas de leitura','Localizar informação explícita em um texto.','Trabalha a busca direta de informações declaradas no texto.'],
  ['D7','I. Práticas de leitura','Inferir informação em um texto.','Exige leitura inferencial e articulação de pistas não literais.'],
  ['D8','I. Práticas de leitura','Inferir o sentido de palavra ou expressão a partir do contexto.','Exige interpretar vocabulário pelo contexto e pelas pistas textuais.'],
  ['D9','I. Práticas de leitura','Identificar o tema central de um texto.','Verifica a compreensão global e a ideia central do texto.'],
  ['D10','I. Práticas de leitura','Distinguir fato de uma opinião.','Avalia diferenciação entre informação verificável e posicionamento opinativo.'],
  ['D11','I. Práticas de leitura','Interpretar textos não verbais e textos que articulam elementos verbais e não verbais.','Exige integrar linguagem verbal e não verbal: imagens, gráficos, quadrinhos, fotos e infográficos.'],
  ['D12','II. Implicações do suporte, do gênero e/ou do enunciador na compreensão do texto','Identificar o gênero do texto.','Avalia reconhecimento do gênero textual e suas marcas.'],
  ['D13','II. Implicações do suporte, do gênero e/ou do enunciador na compreensão do texto','Identificar a finalidade de diferentes gêneros textuais.','Avalia reconhecimento do objetivo comunicativo do gênero textual.'],
  ['D14','III. Relações entre textos','Reconhecer semelhanças e/ou diferenças de ideias e opiniões na comparação entre textos que tratem da mesma temática.','Exige comparação entre textos, contexto de produção e formas de abordagem.'],
  ['D16','IV. Coesão e coerência','Estabelecer relação de causa e consequência entre partes de um texto.','Exige identificar relações lógicas de causalidade no texto.'],
  ['D17','IV. Coesão e coerência','Estabelecer relações lógico-discursivas entre partes de um texto, marcadas por locuções adverbiais ou advérbios.','Avalia conectores e relações de sentido como oposição, causa, conclusão, tempo e condição.'],
  ['D18','IV. Coesão e coerência','Reconhecer relações entre partes de um texto, identificando os recursos coesivos que contribuem para sua continuidade (substituições e repetições).','Avalia coesão referencial e continuidade temática.'],
  ['D19','IV. Coesão e coerência','Identificar a tese de um texto.','Exige reconhecer a posição central defendida pelo texto.'],
  ['D21','IV. Coesão e coerência','Reconhecer o conflito gerador do enredo e os elementos de uma narrativa.','Avalia compreensão da estrutura narrativa e de seus elementos.'],
  ['D27','IV. Coesão e coerência','Diferenciar as partes principais das secundárias em um texto.','Exige hierarquização de informações e identificação de ideias centrais.'],
  ['D22','V. Relações entre recursos expressivos e efeitos de sentido','Identificar efeitos de humor no texto.','Exige compreender sentidos indiretos e efeitos expressivos.'],
  ['D23','V. Relações entre recursos expressivos e efeitos de sentido','Identificar efeitos de sentido decorrente do uso de pontuação e outras notações.','Avalia efeitos produzidos por pontuação, destaque gráfico e marcações expressivas.'],
  ['D24','V. Relações entre recursos expressivos e efeitos de sentido','Reconhecer o efeito de sentido decorrente do emprego de recursos estilísticos e morfossintáticos.','Avalia efeitos produzidos por escolhas gramaticais, ortográficas e sintáticas.'],
  ['D25','V. Relações entre recursos expressivos e efeitos de sentido','Reconhecer o efeito de sentido decorrente da escolha de palavras, frases ou expressões.','Exige reconhecer carga semântica, conotação e escolha lexical.'],
  ['D26','VI. Variação linguística','Identificar as marcas linguísticas que evidenciam o locutor e/ou o interlocutor.','Avalia adequação linguística, marcas sociais, regionais, situacionais e interlocutivas.']
 ];
 const mat=[
  ['D1','I. Geometria','Identificar figuras semelhantes mediante o reconhecimento de relações de proporcionalidade.','Trabalha semelhança, escala e proporcionalidade em figuras.'],
  ['D2','I. Geometria','Reconhecer aplicações das relações métricas do triângulo retângulo em um problema que envolva figuras planas ou espaciais.','Exige mobilizar Pitágoras e relações métricas em contexto.'],
  ['D3','I. Geometria','Relacionar diferentes poliedros ou corpos redondos com suas planificações ou vistas.','Avalia visualização espacial, planificações e vistas.'],
  ['D4','I. Geometria','Identificar a relação entre o número de vértices, faces e/ou arestas de poliedros expressa em um problema.','Exige propriedades de poliedros e relação de Euler.'],
  ['D5','I. Geometria','Resolver problema que envolva razões trigonométricas no triângulo retângulo (seno, cosseno, tangente).','Avalia seno, cosseno e tangente em situações-problema.'],
  ['D6','I. Geometria','Identificar a localização de pontos no plano cartesiano.','Trabalha leitura de coordenadas e localização no plano.'],
  ['D7','I. Geometria','Interpretar geometricamente os coeficientes da equação de uma reta.','Avalia significado de coeficientes angular e linear.'],
  ['D8','I. Geometria','Identificar a equação de uma reta apresentada a partir de dois pontos dados ou de um ponto e sua inclinação.','Exige modelar retas por informações geométricas.'],
  ['D9','I. Geometria','Relacionar a determinação do ponto de interseção de duas ou mais retas com a resolução de um sistema de equações com duas incógnitas.','Integra geometria analítica e sistemas lineares.'],
  ['D10','I. Geometria','Reconhecer, dentre as equações do 2º grau com duas incógnitas, as que representam circunferências.','Avalia identificação algébrica da circunferência.'],
  ['D11','II. Grandezas e medidas','Resolver problema envolvendo perímetro de figuras planas.','Exige selecionar medidas e calcular contornos.'],
  ['D12','II. Grandezas e medidas','Resolver problema envolvendo área de figuras planas.','Avalia cálculo e composição/decomposição de áreas.'],
  ['D13','II. Grandezas e medidas','Resolver problema envolvendo a área total e/ou volume de um sólido (prisma, pirâmide, cilindro, cone, esfera).','Trabalha prismas, pirâmides, cilindros, cones e esferas.'],
  ['D14','III. Números e operações/Álgebra e funções','Identificar a localização de números reais na reta numérica.','Avalia ordenação e representação de números reais.'],
  ['D15','III. Números e operações/Álgebra e funções','Resolver problema que envolva variação proporcional, direta ou inversa, entre grandezas.','Exige modelar proporcionalidade direta e inversa.'],
  ['D16','III. Números e operações/Álgebra e funções','Resolver problema que envolva porcentagem.','Avalia porcentagem, acréscimos, descontos e comparações percentuais.'],
  ['D17','III. Números e operações/Álgebra e funções','Resolver problema envolvendo equação do 2º grau.','Exige modelar e resolver situações com equações quadráticas.'],
  ['D18','III. Números e operações/Álgebra e funções','Reconhecer expressão algébrica que representa uma função a partir de uma tabela.','Integra padrões em tabelas e representação algébrica.'],
  ['D19','III. Números e operações/Álgebra e funções','Resolver problema envolvendo uma função do 1º grau.','Avalia modelagem por função afim.'],
  ['D20','III. Números e operações/Álgebra e funções','Analisar crescimento/decrescimento, zeros de funções reais apresentadas em gráficos.','Exige interpretar gráficos de funções e seus comportamentos.'],
  ['D21','III. Números e operações/Álgebra e funções','Resolver problema envolvendo PA/PG dada a fórmula do termo geral.','Trabalha progressões aritméticas e geométricas.'],
  ['D22','III. Números e operações/Álgebra e funções','Reconhecer o gráfico de uma função polinomial de 1º grau por meio de seus coeficientes.','Avalia relação entre coeficientes e gráfico da função afim.'],
  ['D23','III. Números e operações/Álgebra e funções','Reconhecer a representação algébrica de uma função do 1º grau dado o seu gráfico ou vice-versa.','Exige converter gráfico de reta em lei algébrica e vice-versa.'],
  ['D24','III. Números e operações/Álgebra e funções','Resolver problemas que envolvam os pontos de máximo ou de mínimo de uma função polinomial do 2º grau.','Avalia vértice e interpretação de função quadrática.'],
  ['D25','III. Números e operações/Álgebra e funções','Relacionar as raízes de um polinômio com sua decomposição em fatores do 1º grau.','Trabalha zeros, fatores e fatoração polinomial.'],
  ['D26','III. Números e operações/Álgebra e funções','Identificar a representação algébrica e/ou gráfica de uma função exponencial.','Avalia reconhecimento de crescimento/decrescimento exponencial.'],
  ['D27','III. Números e operações/Álgebra e funções','Identificar a representação algébrica e/ou gráfica de uma função logarítmica, reconhecendo-a como inversa da função exponencial.','Exige relação entre função exponencial e logarítmica.'],
  ['D28','III. Números e operações/Álgebra e funções','Resolver problema que envolva função exponencial.','Avalia modelagem exponencial em situações reais.'],
  ['D29','III. Números e operações/Álgebra e funções','Identificar gráficos de funções trigonométricas (seno, cosseno, tangente) reconhecendo suas propriedades.','Trabalha periodicidade, amplitude e comportamento de seno, cosseno e tangente.'],
  ['D30','III. Números e operações/Álgebra e funções','Determinar a solução de um sistema linear.','Integra sistemas lineares e sua resolução.'],
  ['D35','III. Números e operações/Álgebra e funções','Identificar o gráfico que representa uma situação descrita em um texto.','Avalia tradução entre texto e gráfico.'],
  ['D31','IV. Estatística, probabilidade e combinatória','Resolver problema de contagem utilizando o princípio multiplicativo ou noções de permutação simples, arranjo simples e/ou combinação simples.','Avalia estratégias de contagem e análise combinatória.'],
  ['D32','IV. Estatística, probabilidade e combinatória','Resolver problema que envolva probabilidade de um evento.','Trabalha razão entre casos favoráveis e possíveis.'],
  ['D33','IV. Estatística, probabilidade e combinatória','Resolver problema envolvendo informações apresentadas em tabelas e/ou gráficos.','Avalia leitura e interpretação de dados.'],
  ['D34','IV. Estatística, probabilidade e combinatória','Associar informações apresentadas em listas e/ou tabelas simples aos gráficos que as representam e vice-versa.','Exige converter dados tabulares em representações gráficas e interpretar equivalências.']
 ];
 function build(arr,disc){return arr.map(([codigo,topico,texto,explicacao])=>({codigo,disciplina:disc,topico,texto,explicacao,bncc:'',erros:comum.erros,estrategias:comum.estrategias,intervencao:comum.estrategias,fonte:'SAEPE - Matriz de Referência da 3ª série do Ensino Médio'}));}
 const data={'Língua Portuguesa':build(lp,'Língua Portuguesa'),'Matemática':build(mat,'Matemática')};
 window.Descritores={
  list(disc){if(disc==='todos')return [...data['Língua Portuguesa'],...data['Matemática']];return data[disc]||data['Língua Portuguesa'];},
  get(disc,codigo){return (data[disc]||[]).find(d=>d.codigo===codigo);},
  validCodes(disc){return new Set((data[disc]||[]).map(d=>d.codigo));}
 };
})();
