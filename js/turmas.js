
(function(){
 'use strict';
 const INITIAL_TURMAS = {
  "1º A REDES DE COMPUTADORES": [
    "ALEXANDRE PRUDENTE MOURA DA LUZ",
    "ALEXANDRE RAFAEL GONÇALVES DE LIMA",
    "ALICE GABRIELLY CARVALHO DA SILVA",
    "ALICIA GONÇALVES CABRAL",
    "ALLAN GUILHERME DA SILVA CORREIA",
    "ANA CAROLINA ROCHA DO NASCIMENTO",
    "ANA ELOÍSA FERREIRA DOS SANTOS",
    "ANA GABRIELA ESTEVAM",
    "ANDERSON BARBOSA DA SILVA",
    "ARTHURO AMESTOY DE OLIVEIRA",
    "BRENO MARIANO DOS S NASCIMENTO",
    "CAMILA VICTORIA DA SILVA MELO",
    "CLARICE SOUSA SANTOS MELO",
    "DANIEL HENRIQUE DA SILVA",
    "DAVI VICTOR SITÔNIO DA CRUZ",
    "DAVID FERNANDES SILVA",
    "DEYVISON IGOR DA SILVA",
    "DOUGLAS KAUÃ DOS SANTOS SILVA",
    "ELIZA VIVIANE DA SILVA",
    "ENYA MIRELLA FÉLIX DE LIMA",
    "FRANCIELLY CRISTINA GONÇALVES SILVA",
    "GABRIEL DE FREITAS SIQUEIRA",
    "GUSTAVO MACIEL LIRA DA SILVA",
    "ISABELLY RAMOS DA SILVA",
    "ITALO ISRAEL CABRAL DA SILVA",
    "JHEYMISSON HENRIQUE A DO NASCIMENTO",
    "JHULYEA STEPHANY SANTOS",
    "JOÃO HENRIQUE NASCIMENTO ESPINDULA",
    "JOSÉ HIGOR ARRUDA DA SILVA",
    "JULIO GABRIEL LIMA DOS SANTOS",
    "LUCAS RUAN NOBRE DE ESPINDOLA",
    "LUCAS VINICIUS DA SILVA",
    "MARIA CLARA DE LIMA MEDEIROS",
    "MARIA HELOISA DE OLIVEIRA SILVA",
    "MICHELE SAMARA PAULINO DE OLIVEIRA",
    "PEDRO HENRIQUE DA SILVA LIMA",
    "PÉRIKLES LEYNIEL ALMEIDA LIMA",
    "RAIANY VITORIA DA SILVA",
    "SAMUEL FRANCISCO FARIAS DA COSTA",
    "SOPHIA DE ASSUNÇÃO",
    "TÁRSILA MARIA NASCIMENTO SANTANA",
    "VICTOR EMANOEL ANUNCIAÇÃO DA SILVA",
    "WESLEY VINICIUS DOS SANTOS PINTO",
    "WILLIAM JOSÉ DA SILVA NASCIMENTO",
    "WILLYANNE APARECIDA DA SILVA"
  ],
  "1º B REDES DE COMPUTADORES": [
    "ANDRÉ HENRIQUE BASÍLIO DE ALBUQUERQUE",
    "ANDREIA RIBEIRO DOS SANTOS LIMA",
    "ANDRIELY LAIS DA SILVA LIMA",
    "BEATRIZ BARBOSA DA SILVA",
    "BRENO DE CARVALHO PEREIRA",
    "DIEGO WAGNER DE MELO NASCIMENTO",
    "ERIC VINÍCIUS PEREIRA DE MELO",
    "ERICK JHONNATA SOARES DOS SANTOS",
    "GABRIEL DA SILVA SANTOS",
    "GUILHERME HENRIQUE DE ARRUDA SILVA",
    "HENNOC ZAFENNATTH DOS SANTOS SILVA",
    "IGOR GABRIEL GOMES DA SILVA",
    "ISABELLA SILVA CAVALCANTI",
    "JADIANI JOSEFA APARECIDA CAMPOS DA SILVA",
    "JOÃO LUCAS COSTA DE OLIVEIRA",
    "JOAO VICTOR VIEIRA ANDRADE",
    "JOAO VITOR DOS SANTOS FERREIRA",
    "JOSÉ JONAS PEREIRA RODRIGUES",
    "JOSE OTAVIO GOMES OLIVEIRA",
    "JULIA ISABELLE COUTO SANTOS",
    "KAILLANY VITORIA BARBOSA DA SILVA",
    "KAIO SANTIAGO DA SILVA",
    "KAWAN VINICIUS DA SILVA ALVES",
    "KENNEDY RAFAEL ALVES DA SILVA",
    "LARYSSA EVELYN DE SOUZA SANTOS",
    "LUCAS CISNEIROS SILVA DE OLIVEIRA",
    "LUCAS HENRIQUE OLIVEIRA DOS SANTOS",
    "LUIS ANTONIO JOSE DA SILVA",
    "LUIS HENRIQUE SOARES OLIVEIRA",
    "LUIZ GUILHERME DE SOUSA BEZERRA",
    "MARIA HELOA ZACARIAS DA SILVA",
    "MATEUS VINICIUS VICENTE DE LIMA",
    "NICOLAS DANIEL DA SILVA",
    "PEDRO HENRYQUE DA SILVA LIMA",
    "RONALDO FERREIRA DOS SANTOS FILHO",
    "SARA RAFAELA RODRIGUES DA SILVA",
    "SOPHIA JAEL MOTA DA SILVA",
    "THALITA GONCALVES DA SILVA",
    "THOMAS HENRIQUE DA SILVA NASCIMENTO",
    "VINICIUS SILVA DOS ANJOS",
    "WESLLEY LUIS FERREIRA DA SILVA",
    "YASMIN DE LIMA EUFRAZIO"
  ],
  "2º A REDES DE COMPUTADORES": [
    "BENICIO JOSE DA SILVA",
    "CARLA MAYARA MARIA DA SILVA",
    "CARLA NAYARA MARIA DA SILVA",
    "CARLOS GABRIEL GOMES LAURENTINO",
    "CRHYSTIAN MIGUEL DE SANTANA",
    "CRHYSTIANO ROMILDO DE SANTANA",
    "DAVY JESUS DA SILVA",
    "DIEGO FRANCISCO DE OLIVEIRA LEMOS",
    "EDERSON DIOCRECIO SILVA DOS SANTOS",
    "EDUARDO JOAO NUNES DA SILVA",
    "EMELY ELOYSA PEREIRA DE LIMA",
    "HEITOR FRANCISCO DE MELO SILVA",
    "ISAAC FORTUNATO",
    "JEANE NICOLE DA SILVA SANTOS",
    "JOÃO PEDRO DE LIMA SILVA",
    "JOSE ARTHUR SANTOS LEMOS",
    "KAUA HENRIQUE DA SILVA ROCHA",
    "LARISSA MARIA DE LEMOS",
    "LAURA ISABELLA FERREIRA",
    "LIVIA GABRIELLY BATISTA DA SILVA",
    "MAICON DOUGLAS DA SILVA",
    "MARCOS ANTÔNIO FRANCISCO DA SILVA",
    "MARIA AMANDA DOS SANTOS",
    "MARIA BEATRIZ FERREIRA DA SILVA",
    "MARIA EDUARDA INACIO DE SANTANA",
    "MARIA LUISA LACERDA GOMES",
    "MARIA VICTORIA BEZERRA DE LIMA",
    "MATEUS HENRIQUE MARTINS DA SILVA",
    "MIGUEL PEREIRA DE ARAUJO",
    "PEDRO HENRIQUE ANDRADE DOS SANTOS",
    "PEDRO HENRIQUE VILAR DA SILVA",
    "RUAN CARLOS DO NASCIMENTO SILVA",
    "SABRINA CARLA DA SILVA",
    "THEO HENRIQUE SANTANA MOURA",
    "VICTOR ALEXANDRE FELIX DE ANDRADE",
    "VINICIUS CAMPOS DE ARRUDA SILVA",
    "VITOR HUGO DA SILVA NERI",
    "WAGNER DE SOUZA DE MOURA",
    "YASMIN VICTORIA DA SILVA MOURA"
  ],
  "2º B REDES DE COMPUTADORES": [
    "ALISSON CASTELO BRANCO",
    "ANA JULIA OLIVEIRA SANTOS",
    "ANNA SOPHIA DOMINGOS DA SILVA",
    "BRYAN GABRIEL ALVES DE LIMA",
    "DEYVID FELIPE DOS ANJOS",
    "FABRICIO MARTINS DA SILVA",
    "FERNANDA JOSEFA DE SANTANA",
    "GABRIEL GERMANO DA SILVA",
    "HIAN SERGIO DA SILVA SANTOS",
    "HUAN SERGIO DA SILVA SANTOS",
    "HYAN HENRIQUE CARNEIRO DE SOUZA",
    "ISRAEL ALEXANDRE DA SILVA",
    "JACIELLY FERREIRA DE OLIVEIRA",
    "JESSICA MYLENA DA SILVA SANTOS",
    "JOAB EZIEL DA SILVA",
    "JOÃO CARLOS BARBOSA DE SOUZA",
    "JOAO EMERSON VELOZO DO NASCIMENTO",
    "JOAO PEDRO DE MELO SANTANA",
    "JOSE ALESSANDRO SANTOS ALBUQUERQUE",
    "JOSE DEYVID BEZERRA",
    "JOSIAS MIGUEL COELHO DOS SANTOS",
    "KAMILLY RUANY DA SILVA",
    "KETLYN NICOLLE SILVA",
    "LEANDRO BARRETO DA PAIXAO",
    "LILIAN MACK",
    "LUCAS MIGUEL PEREIRA DO REGO",
    "MAIKON DOUGLAS DA SILVA",
    "MARIA LAURA DELMIRO NEVES",
    "MARIA VITORIA BARBOSA DA SILVA",
    "MATHEUS SOARES DA SILVA",
    "MICAELE ROBERTA DOS SANTOS",
    "NAYANE FERREIRA DE SANTANA",
    "NAYARA FERREIRA DE SANTANA",
    "PEDRO OTAVIO TEIXEIRA DE SOUZA",
    "RAISSA CARVALHO SILVA",
    "RENAN LUCSHINGUE DA SILVA",
    "RUBENS DIEGO LOURENCO SANTOS SILVA",
    "THALISSON TYAGO SILVA DOS SANTOS",
    "THAVYRSON KAUA DA SILVA",
    "THAYNÁ SILVA DE LIMA",
    "VINICIUS CHARLES DE OLIVEIRA SILVA"
  ],
  "3º A REDES DE COMPUTADORES": [
    "ALANA VITORIA DA SILVA SANTOS",
    "ALEX DE ANDRADE DIAS",
    "ALISON DA COSTA ARAUJO",
    "ANA BEATRIZ ANIZIO",
    "ANTONY MANUEL DE OLIVEIRA SANTOS",
    "BRENDA PATRÍCIA JÁCOME BEZERRA",
    "BRENO LOPES NERY",
    "CLARA MARIA DA SILVA",
    "DANIELA MOISES DOS SANTOS",
    "DANIELLY NAVARRO LINS",
    "ERICK ELIANO DA SILVA",
    "GLEYCEANE VITORIA MARTINS SILVA",
    "JOSE HARYSSON DOS SANTOS MOURA",
    "JOSE HENRIQUE PAULINO DOS SANTOS",
    "JOSE VITOR BEZERRA DA SILVA",
    "JOSÉ WILLIAN GABRIEL DE SANTANA",
    "KAUA GOMES DE SOUZA",
    "LUIS MIGUEL SILVA MAIA",
    "MARIA CAMILLE MESSIAS ALVES",
    "MARIA CLARA PAZ DA SILVA",
    "MARIA EDUARDA DA SILVA MOURA",
    "MARIA HELOIZA FERREIRA DA COSTA",
    "MARIA JULIA PEREIRA DA SILVA",
    "MARIA REBECA CARLA DA SILVA",
    "MARIA TAYS BEZERRA DE AMARO",
    "MARIANA SOUSA TORRES",
    "MARIANNY STHEFANNY DE OLIVEIRA SILVA",
    "MATEUS DO NASCIMENTO PEREIRA DE SOUSA",
    "MATHEUS HENRIQUE OLIVEIRA DE SOUZA",
    "MIGUEL VICTOR DA SILVA",
    "PEDRO HENRIQUE CORREIA DE SANTANA",
    "ROMERO KAWE GONCALVES DA SILVA",
    "RUTH MARIA URBANO LIMA",
    "TAYNA RAYANE DA SILVA",
    "VINICIUS MATHEUS BEZERRA DA SILVA",
    "WILAMES SANTOS DA SILVA",
    "WILDERLAN GOMES DA SILVA"
  ],
  "3º B REDES DE COMPUTADORES": [
    "ANNA ELYSA DA SILVA",
    "BIANCA CAMILY BEZERRA ALVES",
    "CAMILLY BEZERRA DOS SANTOS",
    "CARLOS DANIEL DA SILVA",
    "CARLOS HENRIQUE DA SILVA",
    "DARLAN AUGUSTO CAMPOS DA SILVA",
    "DIEGO HENRIQUE ALVES SANTOS",
    "DOUGLAS OTAVIO SILVA",
    "EDMILSON JOSE DA SILVA",
    "EVELYN GIANNA DA SILVA BARROS",
    "GABRIEL HENRIQUE BASILIO DE ALBUQUERQUE",
    "GUILHERME HENRIQUE FARIAS DA COSTA",
    "HYAGO CALIXTO OLIVEIRA DE SOUZA",
    "ISABELLA THAIS BARBOSA DOS SANTOS",
    "IZABELA VITORIA MARIA DE ARRUDA",
    "JOANY VITORIA DA SILVA NASCIMENTO",
    "JOSE ALVARO COSTA LEAL FERREIRA",
    "JOSE FLAVIO LIMA DE SOUZA",
    "JOSÉ FLÁVIO NIKOLLAS BEZERRA BARBOSA",
    "LARISSA TEIXEIRA DE JESUS",
    "LAURA KARINI BARBOSA DA SILVA",
    "LUCAS DANTAS NEVES",
    "MARIA EDUARDA COSTA SILVA",
    "MARIA ELOIZA DE SANTANA SILVA",
    "MARIA LAIZA MOURA DA SILVA",
    "MARIA RITA BATISTA DA SILVA",
    "MARIANA SOFIA SILVA FERNANDES",
    "MATHEUS MARCELO DA SILVA FRANCA",
    "MIGUEL AARAO ESTEVAM",
    "MIGUEL ANGELO SANTOS OLIVEIRA",
    "MIRELLA DA SILVA SANTOS",
    "PEDRO HENRIQUE DA SILVA SANTOS",
    "SABINY MENDES DE VASCONCELOS SANTOS",
    "SAMUEL LUIS RITO",
    "THAFILLA SUZANY SILVA DOS SANTOS",
    "VINICIUS GOGGIN MARQUES SILVA",
    "VITOR FERNANDES LUNA MOUTINHO"
  ],
  "1º A ADMINISTRAÇÃO": [
    "ALANIS JÚLIA FREITAS BARBOSA",
    "ANA CAROLINA DA ROCHA SANTOS",
    "ANDRÉ SILVA LEAO MACHADO",
    "ÁVILA KAUANE VICENTE DE LIMA",
    "BETÂNIA MARIA DA SILVA",
    "BRUNO HENRIQUE TEIXEIRA",
    "CAMILA SUELLEN DE SENA FARIAS",
    "CARLOS EDUARDO DA SILVA",
    "CAUAN EUFRAZIO NOGUEIRA",
    "CLAUDEMILSON KAUAN GOMES",
    "DÉBORA GRAZIELE DA SILVA LIMA",
    "EFRAIN FERREIRA DE MIRANDA",
    "ELIS ARAUJO DE OLIVEIRA",
    "ELOÁ PRISCILA",
    "EMILLY GABRIELLA FERREIRA",
    "EMMANUEL FREITAS DE ARAÚJO",
    "ENZO HECTOR DE OLIVEIRA LIMA",
    "ESTER FERNANDA DA SILVA LIMA",
    "GABRIEL BARBOSA SALES DA COSTA",
    "GABRIEL GOMES DA SILVA",
    "INGRID GRACIELLY PEREIRA LIMA",
    "ISTEFANI MIRELLY RAMOS DA SILVA",
    "JOANA FIRMINO RODRIGUES DA SILVA",
    "JOÃO PEDRO CORDEIRO DIAS",
    "JOSE ALEXANDRE BEZERRA DA SILVA FILHO",
    "JOSÉ AUGUSTO DA SILVA",
    "KARLA FRANCINE DA SILVA FERREIRA",
    "LARISSA BEATRIZ DE LIMA",
    "LAURA MARIA SANTANA DA LUZ",
    "LAYS SANTOS DA SILVA",
    "LORENA COSTA DA SILVA CUNHA",
    "MARCELLA GABRIELY ALVES",
    "MARIA CLARA DE SOUZA RIBEIRO",
    "MILLENA KARLA DE VASCONCELOS",
    "MYLENA MAYSA SOARES DOS SANTOS",
    "RAYANE FORTUNATO DE LIMA",
    "REBECA GABRIELA DOS SANTOS",
    "SAMIRA FLAVIA DE MELO SILVA",
    "SEVERINA MARIA DE FÁTIMA",
    "STHELA MARIA SOARES DE ARAUJO",
    "THALYTA LAURA NUNES DE ARAUJO",
    "VITÓRIA GABRIELA DA SILVA VIEIRA",
    "WILLIANY ISABELLY DOS SANTOS MEDEIROS"
  ],
  "1º B ADMINISTRAÇÃO": [
    "ANA FLÁVIA MARTINS DE OLIVEIRA",
    "ANELYSE MARIA DE SOUZA",
    "CAMILE VITÓRIA LIMA SILVA",
    "CÁSSIA DOS SANTOS ALVES",
    "DEYSIANE LAÍS DA SILVA",
    "ELOÁ CECÍLIA MELO DE LIRA",
    "ELOÁ RIBEIRO SILVA",
    "EMILLY LETICIA DA SILVA",
    "CASTIEL GOMES DA SILVA(ESTHER)",
    "GEORGE RUFINO MARQUES",
    "GUILHERME LEVI DA SILVA",
    "GUSTAVO SALVINO BEZERRA",
    "HEITOR BARCELOS SILVA",
    "IASMYN MEDEIROS DOS ANJOS",
    "JANAELMA EMILLY SILVA",
    "JOÃO GABRIEL SANTOS DA SILVA",
    "JOSÉ ALEXANDRE LIMA DA SILVA",
    "LARA KATHYLLEN SANTOS SILVA",
    "LAYLLA VITÓRIA CARNEIRO DE SENA",
    "LUCAS MARTIM SANTOS",
    "LUISA SANTOS PAULINO",
    "LUIZA GABRYELLE FARIAS SANTOS",
    "LUYZA VITÓRIA SILVA QUINTINO",
    "MARIA ALYCIA COSTA DA SILVA",
    "MARIA CLARA HOLANDA SILVA",
    "MARIA DENISE INOCÊNCIO",
    "MARIA EDUARDA GOMES TAVARES",
    "MARIA KAUANE BEZERRA DA SILVA",
    "MARIA LUIZA DA SILVA RIBEIRO",
    "MICHEL LUCAS DA SILVA",
    "MIGUEL RAFAEL JOSÉ BEZERRA",
    "MYRELLA BEATRIZ SANTOS SILVA",
    "OLAVIO HENRIQUE DE LIMA SILVA",
    "REBECA RODRIGUES PEDROSA",
    "RENAN CASSI DA CRUZ SILVA",
    "RENATA EVELYN CAETANO",
    "RHYANNA VITÓRIA DA SILVA VERÇOSA",
    "SABRINA CAMILA NUNES PIMENTEL",
    "SABRINA VITORIA DA SILVA",
    "SUELLY PATRÍCIA DE LIMA SANTOS",
    "VINÍCIUS SALES DA SILVA",
    "YANNI IASMYN DA SILVA SANTOS"
  ],
  "2º A ADMINISTRAÇÃO": [
    "ALBERTO LOPES DA SILVA",
    "ALINE ALBUQUERQUE SILVA",
    "ALLANYS CAROLINE A DE SANTANA",
    "ANA CAROLINA PESSOA DE SOUZA",
    "ANNA GABRIELA MARQUES DE SOUZA",
    "ANA JULIA SOARES DOS SANTOS",
    "BIANCA VITORIA DE LIMA",
    "CAMILA BEZERRA ALVES DE LIMA",
    "CAUÃ ARTHUR SANTOS COSTA",
    "CLARICE DARLYS BULL",
    "DANIEL JOSE DE LIRA SILVA",
    "DANIELLY KARLA DOS SANTOS",
    "DAVIH WILLIAMS DA SILVA SANTOS",
    "DAYVYD VITOR FERREIRA DA SILVA",
    "EDUARDO LUAN PONTES DE FREITAS",
    "ELLEN MAYSA DE SOUZA SANTOS",
    "EMANUELLY STEFANY DE PAULA",
    "EMILLY VICTORIA DA SILVA",
    "EVILEN RAIANE DE SOUSA SILVA",
    "FRANCINE OLIVEIRA DO CARMO",
    "GABRIELE VITORIA GOMES DA SILVA",
    "IASMIM MAYARA DA SILVA LIMA",
    "IGOR PEDRO PONTES DOS SANTOS",
    "ISABELA GONÇALVES DA SILVA (CARLOS DANIEL)",
    "JARDYELLEN RODRIGUES DA SILVA",
    "JOAO SANDRO DOS SANTOS",
    "JOSE SAMUEL EZEQUIEL DA SILVA",
    "JULIA GABRIELY DA SILVA SOUSA",
    "KALLYNE GABRIELLY DA SILVA",
    "LAIS VANIELLY DOS SANTOS SILVA",
    "MARIA EDUARDA DA SILVA",
    "MARIA JULIA SANTOS SILVA",
    "NICOLY BEATRIZ TRINDADE SILVA",
    "PAULA KAROLAYNE DA SILVA",
    "PEDRO HENRIQUE DE SANTANA DELFINO",
    "RAIANE ERMINIA DA SILVA",
    "SAMARA VITORIA DA SILVA NASCIMENTO",
    "TARCISO NASCIMENTO DE FILHO",
    "VICTOR GABRIEL ALVES BEZERRA",
    "VINICIUS GOUVEIA MARQUES LINS",
    "VITÓRIA DE MEDEIROS SILVA",
    "WILLIAM HENRIQUE F DE OLIVEIRA"
  ],
  "2º B ADMINISTRAÇÃO": [
    "ANA CAROLINE TAVARES DA SILVA",
    "ANA LARISSA DOS SANTOS",
    "ANTONIO COSMO VIEIRA NETO",
    "BIANCA BEZERRA SILVA",
    "BRAYAN GADI PONTES DOS SANTOS",
    "CAMILA VITORIA FREITAS DA SILVA",
    "DAVI JONAS ALVES DA SILVA",
    "EDUARDO JUNIO DO NASCIMENTO",
    "EMILLY VITORIA DOS SANTOS LOPES",
    "EMYLE KELLY BATISTA DE SENA",
    "EVELIN JAMILY DA SILVA",
    "GABRIEL JOSE DOS SANTOS",
    "GIOVANA CAMILY SILVA",
    "GLEYCE ELLEN BARBOSA FERREIRA",
    "GUILHERME GABRIEL DA SILVA",
    "HELYSA GABRIELLE F DA SILVA",
    "HYASMIM MARIA DA SILVA SANTOS",
    "ISABELLA CORREIA CAMARGO",
    "ISAQUE LEITE DA SILVA",
    "JOSÉ GUILHERME F R S DA SILVA",
    "JOSÉ RAFAEL LIRA",
    "JOSÉ RENATO DA SILVA",
    "JULLIAN ROBERTA PAIVA DE MOURA",
    "KAMILA VITORIA GOMES DOS SANTOS",
    "LAYS ALICE DA SILVA",
    "LEANDRA VITÓRIA SOUZA SILVA",
    "MANUEL PEREIRA DE ARAUJO",
    "MARIA DAS GRACAS SILVA",
    "MARIA MIRELLA GONCALVES CORREIA",
    "MARIA NERI DA CONCEICAO",
    "MARIA VITORIA DA SILVA",
    "MATHEUS FELYPE CIRINO DE LIMA",
    "MICHELLY DOS SANTOS DE SANTANA",
    "NAUANY ANTONYA LINS COSTA",
    "NICOLLE NUNES LIRA SANTOS",
    "PEDRO WAGNER DA SILVA BEZERRA",
    "RAFAELA ADRIANA QUIRINO",
    "TAIS BETIANE DA SILVA",
    "THAINA GABRIELA CANDIDO DA SILVA",
    "THIAGO BEZERRA DA SILVA",
    "VITOR MIKAEL PEREIRA DA SILVA",
    "YASMIM RAISSA MELO DA SILVA"
  ],
  "3º A ADMINISTRAÇÃO": [
    "ALANA MARIA DE SANTANA ALBUQUERQUE",
    "ANA NATHIELY DA CONCEICAO RODRIGUES",
    "ARTHUR CESAR DE ARRUDA FERREIRA",
    "CAMILA CRISTINA DA SILVA",
    "CARLOS DANIEL BARBOSA DE SOUZA",
    "CARLOS EDUARDO BORBA SILVA",
    "CLEITON KAUÃ FERNANDES DA SILVA",
    "CLIVIA SABRINNA DA ROCHA",
    "DIEGO HENRIQUE FERREIRA DA SILVA",
    "ELLEN VANDERLEI DA SILVA",
    "GABRIELA DO VALE RIBEIRO BARBOSA",
    "JAMILLY SILVESTRE DE ARAUJO",
    "JOAO FELIPE RIBEIRO DO NASCIMENTO",
    "JULIA GABRIELLY DE MEDEIROS SILVA",
    "JULIO CESAR DE LEMOS SILVA",
    "KAYKY VITOR DOS SANTOS",
    "LETICIA BEATRIZ FERNANDES SALES",
    "LUCAS GUILHERME DA SILVA",
    "LUIZ FERNANDO DE LUNA SOUZA",
    "MARIA ALICE DE LEMOS BRANDAO",
    "MARIA CLARA DA SILVA",
    "MARIA CLARA NEVES DE LEMOS",
    "MARIA EDUARDA PAULINO DE MELO",
    "MARIA LETICIA E SILVA",
    "MARIA LETICIA SANTOS RODRIGUES",
    "MARIA LUIZA BEZERRA SILVA",
    "MARIANNE MABEL DA SILVA",
    "MARYNNA KYARA DA SILVA",
    "MAYSA SOFHIA NEVES CAVALCANTE",
    "RAYANE VITORIA BISPO",
    "REBECA LARISSA CAMARGO",
    "STEFFANY SOPHIA DE MOURA SOUZA",
    "TAINA FERREIRA DA SILVA",
    "THAYNA LOHANNY DE SOUSA SILVA",
    "THIAGO JUNIOR DE LIMA",
    "VICTOR EMANUEL DAS CHAGAS",
    "YASMIM GABRIELY SILVA PASSOS"
  ],
  "3º B ADMINISTRAÇÃO": [
    "ADRIAN HENRIQUE BARBOSA DE SOUZA",
    "ANA KAROLYNE DA SILVA",
    "ANDRIEL FERNANDO ANTAO COSTA",
    "ANGELA MARINHO DA SILVA",
    "ANNA BEATRIZ DE MORAIS SILVA",
    "CHAYENNE SILVA DOS SANTOS",
    "CLARA BEATRIZ DAS NEVES SANTOS",
    "ELLEN SOPHIA VICTORIA DA SILVA",
    "FERNANDA BARBOSA MAIA",
    "GABRIELA SANTANA DA SILVA",
    "GISELI BRITNEY DUDA DA SILVA",
    "GUILHERME ALEXANDRE F DOS SANTOS",
    "HERNANDES GABRIEL DE LIMA SANTOS",
    "ISABELLA THAYS FARIAS DOS SANTOS",
    "JOÃO VITOR FERREIRA SILVA",
    "JUAN EMANUEL SILVA DE MOURA",
    "JULLIO CESAR LOPES DE SOUZA",
    "LAIS GABRIELY SANTOS DA SILVA",
    "LUANA BEZERRA DA SILVA",
    "LUCAS ESPINDOLA DE ARAUJO",
    "MARIA BEATRIZ CAVALCANTE",
    "MARIA EDUARDA MENDONCA SOARES",
    "MARIA JULIA MEDEIROS SILVA",
    "MARIA LETICIA MARQUES DA SILVA",
    "MARIA LUISA SOARES LOPES",
    "MARIA VITORIA DA SILVA",
    "PATRICIA TRAJANO",
    "ROGER FRANCISCO BEZERRA SILVA",
    "TAIS MARIA DAS NEVES ALVES",
    "VITORYA GABRIELLA DA SILVA",
    "WAGNER JOSE PAULINO DA SILVA"
  ]
};
 const STORE='vetor_turmas_v68_6';
 const ARCHIVE='vetor_turmas_arquivadas_v68_6';
 const $=s=>document.querySelector(s);
 const safe=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
 const norm=s=>String(s??'').trim().replace(/\s+/g,' ');
 function studentKeyName(nome){
   return norm(nome).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 }
 function isPlaceholderStudentName(nome){
   const n=studentKeyName(nome);
   return !n || /^ALUNO(?:\s*(?:\d+|X+|SEM\s+NOME))?$/.test(n) || /^NOME\s+DO\s+ALUNO$/.test(n) || /^ESTUDANTE(?:\s*(?:\d+|X+))?$/.test(n);
 }
 function stripTurmaSubject(t){
   return norm(t)
     .replace(/\s*(?:[•-]|Ã¢â‚¬Â¢)\s*(?:L(?:í|Ã­|ÃƒÂ­)ngua\s+Portuguesa|Portugu(?:ê|Ãª|ÃƒÂª)s|Portugues|Matem(?:á|Ã¡|ÃƒÂ¡)tica|Matematica)\s*$/i,'')
     .trim();
 }
 function turmaCanonicalInfo(t){
   const raw=stripTurmaSubject(t);
   const ascii=raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
   const serie=(ascii.match(/([123])\s*(?:O|A|º|ª|°)?/)||[])[1]||'';
   const letra=(ascii.match(/\b([AB])\b/)||[])[1]||'';
   const curso=ascii.includes('REDES')?'Redes':((ascii.includes('ADM')||ascii.includes('ADMINISTRACAO'))?'Administração':'');
   if(serie&&letra&&curso)return {key:`${serie}|${letra}|${curso.toUpperCase()}`,label:`${serie}º ${letra} ${curso}`};
   return {key:raw.toLowerCase(),label:raw};
 }
 function cleanTurmaName(t){return turmaCanonicalInfo(t).label;}
 function officialCountForTurma(clean){
   try{
     const item=Object.entries(INITIAL_TURMAS||{}).find(([turma])=>cleanTurmaName(turma)===clean);
     return item?item[1].length:null;
   }catch(e){return null;}
 }
 function officialRosterForTurma(clean){
   try{
     const item=Object.entries(INITIAL_TURMAS||{}).find(([turma])=>cleanTurmaName(turma)===clean);
     return item?item[1].map(n=>norm(n).toUpperCase()).filter(n=>n&&!isPlaceholderStudentName(n)):null;
   }catch(e){return null;}
 }
 function mergeTurmasObject(obj){
   const groups={};
   Object.entries(obj||{}).forEach(([turma,alunos])=>{
     const clean=cleanTurmaName(turma);
     if(!clean)return;
     const roster=[];
     (Array.isArray(alunos)?alunos:[]).forEach(nome=>{
       const n=norm(nome).toUpperCase();
       if(isPlaceholderStudentName(n))return;
       if(n && !roster.some(x=>String(x).toUpperCase()===n))roster.push(n);
     });
     (groups[clean]??=[]).push({raw:turma,alunos:roster});
   });
   const merged={};
   Object.entries(groups).forEach(([clean,candidates])=>{
     const official=officialCountForTurma(clean);
     const officialRoster=officialRosterForTurma(clean);
     const scored=candidates.slice().sort((a,b)=>{
       if(official!=null){
         const da=Math.abs(a.alunos.length-official), db=Math.abs(b.alunos.length-official);
         if(da!==db)return da-db;
       }
       const pollutedA=/\s[-•]\s*(Língua Portuguesa|Português|Portugues|Matemática|Matematica)\s*$/i.test(String(a.raw));
       const pollutedB=/\s[-•]\s*(Língua Portuguesa|Português|Portugues|Matemática|Matematica)\s*$/i.test(String(b.raw));
       if(pollutedA!==pollutedB)return pollutedA?1:-1;
       return b.alunos.length-a.alunos.length;
     });
     let chosen=scored[0]?.alunos||[];
     if(officialRoster?.length && chosen.length>Math.ceil(officialRoster.length*1.35)){
       const officialSet=new Set(officialRoster.map(studentKeyName));
       const filtered=chosen.filter(nome=>officialSet.has(studentKeyName(nome)));
       chosen=filtered.length>=Math.floor(officialRoster.length*0.8)?filtered:officialRoster;
     }
     merged[clean]=chosen;
   });
   Object.keys(merged).forEach(t=>merged[t].sort((a,b)=>a.localeCompare(b,'pt-BR')));
   return merged;
 }
 function clone(o){return JSON.parse(JSON.stringify(o||{}));}
 function load(){try{const raw=JSON.parse(localStorage.getItem(STORE)||'null'); if(raw && typeof raw==='object'){const merged=mergeTurmasObject(raw); localStorage.setItem(STORE,JSON.stringify(merged)); return merged;}}catch{} const base=mergeTurmasObject(clone(INITIAL_TURMAS)); localStorage.setItem(STORE,JSON.stringify(base)); return base;}
 function loadArchive(){try{return JSON.parse(localStorage.getItem(ARCHIVE)||'{}')||{}}catch{return {}}}
 function save(data){const merged=mergeTurmasObject(data); turmas=merged; localStorage.setItem(STORE,JSON.stringify(merged));}
 function saveArchive(data){localStorage.setItem(ARCHIVE,JSON.stringify(data));}
 let turmas=load();
 let arquivadas=loadArchive();
 let cloudMode=false;
 let turmaIdByName={};
 let alunoIdByKey={};
 // Counts local operations that are mid-flight to Supabase (add/edit/delete/
 // transfer aluno, create/rename turma). While this is >0, refreshCloud()
 // must not run its full destructive replace of `turmas`, since the server
 // snapshot it would fetch may not yet reflect the write that's still in
 // progress — replacing `turmas` at that moment silently discards the
 // in-progress edit (this was the main way saving one turma appeared to
 // "bug" another: an unrelated background refresh landed mid-write).
 let inFlight=0;
 const keyAluno=(turma,nome)=>String(turma||'')+'||'+String(nome||'').toUpperCase();
 function cloud(){const C=window.VETORSupabase; return (C&&C.client&&C.session)?C:null;}
 async function refreshCloud(){
   const C=cloud();
   if(!C)return false;
   if(inFlight>0)return false; // a local save is still being written to Supabase — don't overwrite it with a stale read
   try{
     const {data:trs,error:tErr}=await C.client.from('turmas').select('id,nome,serie').order('nome');
     if(tErr)throw tErr;
      const local={}; turmaIdByName={}; alunoIdByKey={};
      (trs||[]).forEach(t=>{const raw=norm(t.nome||'Turma sem nome'); const clean=cleanTurmaName(raw); local[raw]=local[raw]||[]; if(!turmaIdByName[clean])turmaIdByName[clean]=t.id;});
      const {data:als,error:aErr}=await C.client.from('alunos').select('id,nome,turma_id,turmas(nome)').order('nome');
      if(aErr)throw aErr;
      (als||[]).forEach(a=>{const raw=norm(a.turmas?.nome || (trs||[]).find(t=>t.id===a.turma_id)?.nome); const clean=cleanTurmaName(raw); if(!raw||!clean)return; local[raw]=local[raw]||[]; const nome=String(a.nome||'').trim().toUpperCase(); if(isPlaceholderStudentName(nome))return; if(nome&&!local[raw].includes(nome))local[raw].push(nome); alunoIdByKey[keyAluno(clean,nome)]=a.id;});
      Object.keys(local).forEach(t=>local[t].sort((a,b)=>a.localeCompare(b,'pt-BR')));
      if(Object.keys(local).length){turmas=mergeTurmasObject(local); cloudMode=true; save(turmas); render(); setStatus('Turmas e alunos sincronizados com o Supabase.','ok');}
     return true;
   }catch(e){setStatus('Erro ao sincronizar alunos com Supabase: '+e.message,'error'); return false;}
 }
  async function ensureCloudTurma(nome){
    const C=cloud(); if(!C)return null;
    nome=cleanTurmaName(nome);
    if(turmaIdByName[nome])return turmaIdByName[nome];
   // The cache can be cold (e.g. right after page load, before the delayed
   // refreshCloud() finishes) — always double-check with Supabase before
   // inserting, otherwise two turmas with the identical name get created,
   // silently splitting that turma's roster across two different ids.
    const {data:allRows,error:allErr}=await C.client.from('turmas').select('id,nome');
    if(allErr)throw allErr;
    const match=(allRows||[]).find(t=>cleanTurmaName(t.nome)===nome);
    if(match?.id){turmaIdByName[nome]=match.id; return match.id;}
    const {data:existing,error:findErr}=await C.client.from('turmas').select('id').eq('nome',nome).maybeSingle();
   if(findErr)throw findErr;
   if(existing?.id){turmaIdByName[nome]=existing.id; return existing.id;}
   const serie=(String(nome).match(/^(\dº|\dª|\d+º|\d+)/)||[''])[0] || 'Não informada';
   const {data,error}=await C.client.from('turmas').insert({nome,serie}).select('id').single();
   if(error)throw error; turmaIdByName[nome]=data.id; return data.id;
 }
  async function cloudAddAluno(turma,nome){
    const C=cloud(); if(!C)return false;
    const turma_id=await ensureCloudTurma(turma);
    const clean=String(nome||'').trim().toUpperCase();
    if(isPlaceholderStudentName(clean))return false;
   const {data:exists,error:e1}=await C.client.from('alunos').select('id').eq('turma_id',turma_id).eq('nome',clean).maybeSingle();
   if(e1)throw e1;
   if(exists?.id){alunoIdByKey[keyAluno(turma,clean)]=exists.id; return true;}
   const {data,error}=await C.client.from('alunos').insert({nome:clean,turma_id}).select('id').single();
   if(error)throw error; alunoIdByKey[keyAluno(turma,clean)]=data.id; return true;
 }
 async function cloudUpdateAluno(turma,oldNome,newNome){
   const C=cloud(); if(!C)return false;
   let id=alunoIdByKey[keyAluno(turma,oldNome)];
   if(!id){const turma_id=await ensureCloudTurma(turma); const r=await C.client.from('alunos').select('id').eq('turma_id',turma_id).eq('nome',String(oldNome).toUpperCase()).maybeSingle(); if(r.error)throw r.error; id=r.data?.id;}
   if(!id)return false;
   const {error}=await C.client.from('alunos').update({nome:String(newNome).toUpperCase()}).eq('id',id);
   if(error)throw error; delete alunoIdByKey[keyAluno(turma,oldNome)]; alunoIdByKey[keyAluno(turma,newNome)]=id; return true;
 }
 async function cloudDeleteAluno(turma,nome){
   const C=cloud(); if(!C)return false;
   let id=alunoIdByKey[keyAluno(turma,nome)];
   if(!id){const turma_id=await ensureCloudTurma(turma); const r=await C.client.from('alunos').select('id').eq('turma_id',turma_id).eq('nome',String(nome).toUpperCase()).maybeSingle(); if(r.error)throw r.error; id=r.data?.id;}
   if(!id)return false;
   const {error}=await C.client.from('alunos').delete().eq('id',id);
   if(error)throw error; delete alunoIdByKey[keyAluno(turma,nome)]; return true;
 }
 async function cloudTransferAluno(origem,destino,nome){
   const C=cloud(); if(!C)return false;
   let id=alunoIdByKey[keyAluno(origem,nome)];
   if(!id){const turma_id=await ensureCloudTurma(origem); const r=await C.client.from('alunos').select('id').eq('turma_id',turma_id).eq('nome',String(nome).toUpperCase()).maybeSingle(); if(r.error)throw r.error; id=r.data?.id;}
   if(!id)return false;
   const destino_id=await ensureCloudTurma(destino);
   const {error}=await C.client.from('alunos').update({turma_id:destino_id}).eq('id',id);
   if(error)throw error; delete alunoIdByKey[keyAluno(origem,nome)]; alunoIdByKey[keyAluno(destino,nome)]=id; return true;
 }
 async function cloudCreateTurma(nome){
   const C=cloud(); if(!C)return false;
   await ensureCloudTurma(nome); return true;
 }

 function orderedKeys(obj=turmas){return Object.keys(obj).sort((a,b)=>a.localeCompare(b,'pt-BR',{numeric:true}));}
 function getTurmas(){return turmas;}
 function getArquivadas(){return arquivadas;}
 function getAlunos(turma){return (turmas[turma]||[]).slice();}
 function allCount(obj){return Object.values(obj).reduce((s,a)=>s+(Array.isArray(a)?a.length:0),0);}
 function download(name, content, type='text/plain;charset=utf-8'){const blob=new Blob([content],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},700);}
 function toCsv(rows){return rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');}
 function exportTurmaCsv(turma){const rows=[['Turma','Nº','Aluno'],...(turmas[turma]||[]).map((n,i)=>[turma,i+1,n])]; download(`alunos_${turma.replace(/\W+/g,'_')}.csv`, toCsv(rows), 'text/csv;charset=utf-8');}
 function exportAllJson(){download('turmas_alunos_vetor_v68_6.json', JSON.stringify({ativas:turmas,arquivadas},null,2), 'application/json;charset=utf-8');}
 function exportAllCsv(){const rows=[['Status','Turma','Nº','Aluno']]; orderedKeys(turmas).forEach(t=>turmas[t].forEach((n,i)=>rows.push(['Ativa',t,i+1,n]))); orderedKeys(arquivadas).forEach(t=>arquivadas[t].forEach((n,i)=>rows.push(['Arquivada',t,i+1,n]))); download('turmas_alunos_vetor_v68_6.csv', toCsv(rows), 'text/csv;charset=utf-8');}
 function currentTurma(){return $('#turmaCadastroSelect')?.value || orderedKeys()[0] || '';}
 function setStatus(msg,type='work'){const el=$('#turmaStatus'); if(!el)return; el.className='statusbox '+(type==='ok'?'status-ok':type==='error'?'status-error':'status-work'); el.innerHTML=msg;}
 function renderStats(){const el=$('#turmaCadastroStats'); if(el)el.innerHTML=`<div class="card"><span>Turmas ativas</span><b>${orderedKeys(turmas).length}</b></div><div class="card"><span>Alunos ativos</span><b>${allCount(turmas)}</b></div><div class="card"><span>Arquivadas</span><b>${orderedKeys(arquivadas).length}</b></div><div class="card"><span>Alunos arquivados</span><b>${allCount(arquivadas)}</b></div>`;}
 function renderSelects(){const sel=$('#turmaCadastroSelect'); if(sel){const old=sel.value; sel.innerHTML=orderedKeys(turmas).map(t=>`<option value="${safe(t)}">${safe(t)} (${turmas[t].length})</option>`).join(''); if(old&&turmas[old])sel.value=old;}
 const transfer=$('#alunoTransferTurma'); if(transfer){const curr=currentTurma(); transfer.innerHTML=orderedKeys(turmas).filter(t=>t!==curr).map(t=>`<option value="${safe(t)}">${safe(t)}</option>`).join('');}
 const arch=$('#turmaArquivadaSelect'); if(arch){arch.innerHTML=orderedKeys(arquivadas).map(t=>`<option value="${safe(t)}">${safe(t)} (${arquivadas[t].length})</option>`).join('');}
 }
 function renderList(){const list=$('#turmaCadastroList'); if(!list)return; const turma=currentTurma(); const alunos=turmas[turma]||[]; const filter=norm($('#turmaAlunoBusca')?.value||'').toUpperCase(); const rows=alunos.map((n,i)=>({n,i})).filter(x=>!filter||x.n.toUpperCase().includes(filter));
 list.innerHTML=`<div class="roster-head"><h3>${safe(turma||'Nenhuma turma ativa')}</h3><span class="mini-tag">${alunos.length} alunos</span></div>`+
 `<ol class="student-roster editable-roster">`+rows.map(x=>`<li><span>${safe(x.n)}</span><div class="mini-actions"><button class="secondary" data-edit-student="${x.i}">Editar</button><button class="secondary" data-transfer-student="${x.i}">Transferir</button><button class="danger" data-delete-student="${x.i}">Excluir</button></div></li>`).join('')+`</ol>`;
 }
 function render(){renderSelects(); renderStats(); renderList();}
  async function createTurma(){const name=cleanTurmaName($('#novaTurmaNome')?.value||''); if(!name)return setStatus('Informe o nome da nova turma.','error'); if(turmas[name])return setStatus('Essa turma já existe.','error'); inFlight++; try{if(cloud())await cloudCreateTurma(name);}catch(e){return setStatus('Erro ao criar turma no Supabase: '+e.message,'error');}finally{inFlight--;} turmas[name]=turmas[name]||[]; save(turmas); $('#novaTurmaNome').value=''; render(); setStatus('Turma criada: '+safe(name)+(cloud()?' e salva no Supabase.':''),'ok');}
  async function renameTurma(){const old=currentTurma(); const name=cleanTurmaName($('#renomearTurmaNome')?.value||''); if(!old)return; if(!name)return setStatus('Informe o novo nome da turma.','error'); if(turmas[name])return setStatus('Já existe uma turma com esse nome.','error'); inFlight++; try{const C=cloud(); if(C){const turma_id=await ensureCloudTurma(old); const {error}=await C.client.from('turmas').update({nome:name}).eq('id',turma_id); if(error)throw error; delete turmaIdByName[old]; turmaIdByName[name]=turma_id;}}catch(e){return setStatus('Erro ao renomear turma no Supabase: '+e.message,'error');}finally{inFlight--;} turmas[name]=turmas[old]; delete turmas[old]; save(turmas); $('#renomearTurmaNome').value=''; render(); $('#turmaCadastroSelect').value=name; render(); setStatus('Turma renomeada'+(cloud()?' e sincronizada com o Supabase.':'.'),'ok');}
 function archiveTurma(){const turma=currentTurma(); if(!turma)return; if(!confirm(`Arquivar a turma "${turma}"? O histórico será preservado e ela deixará de aparecer como turma ativa.`))return; arquivadas[turma]=turmas[turma]||[]; delete turmas[turma]; save(turmas); saveArchive(arquivadas); render(); setStatus('Turma arquivada com sucesso.','ok');}
 function restoreTurma(){const t=$('#turmaArquivadaSelect')?.value; if(!t)return setStatus('Nenhuma turma arquivada selecionada.','error'); let name=t; if(turmas[name]) name=t+' - Reativada'; turmas[name]=arquivadas[t]; delete arquivadas[t]; save(turmas); saveArchive(arquivadas); render(); setStatus('Turma reativada.','ok');}
 async function addAluno(){const turma=currentTurma(); const name=norm($('#novoAlunoNome')?.value||''); if(!turma)return; if(!name)return setStatus('Informe o nome do aluno.','error'); if(isPlaceholderStudentName(name))return setStatus('Informe o nome real do aluno. Registros como "Aluno 1" são ignorados.','error'); if((turmas[turma]||[]).some(n=>n.toUpperCase()===name.toUpperCase()))return setStatus('Aluno já cadastrado nessa turma.','error'); inFlight++; try{if(cloud())await cloudAddAluno(turma,name);}catch(e){return setStatus('Erro ao salvar aluno no Supabase: '+e.message,'error');}finally{inFlight--;} turmas[turma].push(name.toUpperCase()); turmas[turma].sort((a,b)=>a.localeCompare(b,'pt-BR')); save(turmas); $('#novoAlunoNome').value=''; render(); setStatus('Aluno adicionado'+(cloud()?' e salvo no Supabase.':'.'),'ok');}
 async function editAluno(idx){const turma=currentTurma(); const old=turmas[turma]?.[idx]; if(!old)return; const name=norm(prompt('Editar nome do aluno:', old)); if(!name)return; if(isPlaceholderStudentName(name))return setStatus('Informe o nome real do aluno. Registros como "Aluno 1" são ignorados.','error'); inFlight++; try{if(cloud())await cloudUpdateAluno(turma,old,name);}catch(e){return setStatus('Erro ao editar aluno no Supabase: '+e.message,'error');}finally{inFlight--;} turmas[turma][idx]=name.toUpperCase(); turmas[turma].sort((a,b)=>a.localeCompare(b,'pt-BR')); save(turmas); render(); setStatus('Aluno editado'+(cloud()?' no Supabase.':'.'),'ok');}
 async function deleteAluno(idx){const turma=currentTurma(); const old=turmas[turma]?.[idx]; if(!old)return; if(!confirm('Excluir aluno da turma atual?\n\n'+old))return; inFlight++; try{if(cloud())await cloudDeleteAluno(turma,old);}catch(e){return setStatus('Erro ao excluir aluno no Supabase: '+e.message,'error');}finally{inFlight--;} turmas[turma].splice(idx,1); save(turmas); render(); setStatus('Aluno excluído'+(cloud()?' do Supabase.':' da turma.'),'ok');}
 async function transferAluno(idx){const turma=currentTurma(); const old=turmas[turma]?.[idx]; if(!old)return; const destino=$('#alunoTransferTurma')?.value || prompt('Transferir para qual turma?'); if(!destino||!turmas[destino])return setStatus('Turma de destino inválida.','error'); inFlight++; try{if(cloud())await cloudTransferAluno(turma,destino,old);}catch(e){return setStatus('Erro ao transferir aluno no Supabase: '+e.message,'error');}finally{inFlight--;} turmas[turma].splice(idx,1); if(!turmas[destino].some(n=>n.toUpperCase()===old.toUpperCase()))turmas[destino].push(old); turmas[destino].sort((a,b)=>a.localeCompare(b,'pt-BR')); save(turmas); render(); setStatus('Aluno transferido para '+safe(destino)+(cloud()?' no Supabase.':'.'),'ok');}
 function applyAssessment(){const turma=currentTurma(); const A=window.VETOR; if(!A||!turma)return; const a=A.state.assessment||{};
   // This button reads the turma from the Turmas-tab dropdown (#turmaCadastroSelect),
   // which is a SEPARATE control from the "Turma *" field on the Correção/Avaliação
   // tab (#assessmentClass). If a teacher already picked a turma there and this one
   // is showing something else (e.g. left over from browsing rosters earlier), a
   // silent overwrite here was exactly what made a save "land" in the wrong turma.
   const hasOwnTurma = a.turma && norm(a.turma)!==norm(turma);
   const hasData = (a.students||[]).length>0 || !!a.id;
   if(hasOwnTurma && hasData){
     const ok=confirm(`A avaliação atual já está associada à turma "${a.turma}"${(a.students||[]).length?` (${a.students.length} aluno(s) já carregado(s))`:''}.\n\nTrocar agora para "${turma}"?\n\nConfirme que é essa a troca pretendida antes de continuar — a turma "${a.turma}" não é apagada, mas a avaliação em edição passa a apontar para "${turma}".`);
     if(!ok){ setStatus('Nada alterado — a avaliação continua associada a "'+safe(a.turma)+'".','work'); return; }
   }
   a.turma=turma; if(!(a.students||[]).length) a.students=(turmas[turma]||[]).map(name=>({name,answers:[]})); A.state.assessment=a; const input=$('#assessmentClass'); if(input) input.value=turma; A.save?.(); A.renderAll?.(); setStatus('Turma aplicada à avaliação atual: '+safe(turma)+'.','ok');}
 function buildTemplateRows(){const turma=currentTurma(); const n=Math.max(1,Math.min(100,Number($('#templateQuestionsCount')?.value)||26)); const rows=[]; rows.push(['Nome do aluno',...Array.from({length:n},(_,i)=>'Q'+(i+1))]); rows.push(['Descritor',...Array.from({length:n},()=> '')]); rows.push(['Gabarito',...Array.from({length:n},()=> '')]); (turmas[turma]||[]).forEach(name=>rows.push([name,...Array.from({length:n},()=> '')])); return rows;}
 function downloadTemplate(){const turma=currentTurma(); const rows=buildTemplateRows(); const filename=`modelo_respostas_${turma.replace(/\W+/g,'_')}.xlsx`; if(window.XLSX){const ws=XLSX.utils.aoa_to_sheet(rows); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Respostas'); XLSX.writeFile(wb,filename); setStatus('Planilha modelo Excel gerada.','ok');} else {download(filename.replace('.xlsx','.csv'),toCsv(rows),'text/csv;charset=utf-8'); setStatus('Biblioteca Excel indisponível. Modelo CSV gerado.','ok');}}
 function parseCsvLine(line){const out=[]; let cur='',q=false; for(let i=0;i<line.length;i++){const ch=line[i]; if(ch==='"'&&line[i+1]==='"'){cur+='"';i++;} else if(ch==='"')q=!q; else if((ch===','||ch===';'||ch==='\t')&&!q){out.push(cur.trim());cur='';} else cur+=ch;} out.push(cur.trim()); return out;}
 async function importListText(text){const rows=text.split(/\r?\n/).map(parseCsvLine).filter(r=>r.some(Boolean)); if(!rows.length)return; const header=rows[0].map(x=>x.toLowerCase()); const turmaIdx=header.findIndex(x=>x.includes('turma')); const alunoIdx=header.findIndex(x=>x.includes('aluno')||x.includes('nome')); const current=currentTurma(); let added=0;
 inFlight++;
 try{
for(const r of rows.slice(1)){const turma=norm(turmaIdx>=0?r[turmaIdx]:current); const aluno=norm(alunoIdx>=0?r[alunoIdx]:r[0]); if(!turma||!aluno||isPlaceholderStudentName(aluno))continue; turmas[turma]=turmas[turma]||[]; if(!turmas[turma].some(n=>n.toUpperCase()===aluno.toUpperCase())){try{if(cloud())await cloudAddAluno(turma,aluno);}catch(e){return setStatus('Erro ao importar aluno no Supabase: '+e.message,'error');} turmas[turma].push(aluno.toUpperCase()); added++;} }
 }finally{inFlight--;}
 Object.keys(turmas).forEach(t=>turmas[t].sort((a,b)=>a.localeCompare(b,'pt-BR'))); save(turmas); render(); setStatus(`${added} aluno(s) importado(s)${cloud()?' e salvos no Supabase':''}.`,'ok');}
 async function importRosterFile(file){if(!file)return; if(/\.xlsx?$/i.test(file.name)&&window.XLSX){const buf=await file.arrayBuffer(); const wb=XLSX.read(buf,{type:'array'}); const ws=wb.Sheets[wb.SheetNames[0]]; const rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:false,defval:''}); importListText(rows.map(r=>r.join(',')).join('\n'));} else {importListText(await file.text());}}
 function bind(){ 
   $('#turmaCadastroSelect')&&($('#turmaCadastroSelect').onchange=render);
   $('#turmaAlunoBusca')&&($('#turmaAlunoBusca').oninput=renderList);
   $('#criarTurmaBtn')&&($('#criarTurmaBtn').onclick=createTurma);
   $('#renomearTurmaBtn')&&($('#renomearTurmaBtn').onclick=renameTurma);
   $('#arquivarTurmaBtn')&&($('#arquivarTurmaBtn').onclick=archiveTurma);
   $('#reativarTurmaBtn')&&($('#reativarTurmaBtn').onclick=restoreTurma);
   $('#addAlunoBtn')&&($('#addAlunoBtn').onclick=addAluno);
   $('#turmaApplyAssessment')&&($('#turmaApplyAssessment').onclick=applyAssessment);
   $('#turmaExportCsv')&&($('#turmaExportCsv').onclick=()=>exportTurmaCsv(currentTurma()));
   $('#turmaExportJson')&&($('#turmaExportJson').onclick=exportAllJson);
   $('#turmaExportAllCsv')&&($('#turmaExportAllCsv').onclick=exportAllCsv);
   $('#baixarModeloTurma')&&($('#baixarModeloTurma').onclick=downloadTemplate);
   $('#importTurmaFile')&&($('#importTurmaFile').onchange=e=>importRosterFile(e.target.files?.[0]));
   document.addEventListener('click',e=>{const b=e.target.closest('[data-edit-student],[data-delete-student],[data-transfer-student]'); if(!b)return; const idx=Number(b.dataset.editStudent??b.dataset.deleteStudent??b.dataset.transferStudent); if(b.dataset.editStudent!=null)editAluno(idx); if(b.dataset.deleteStudent!=null)deleteAluno(idx); if(b.dataset.transferStudent!=null)transferAluno(idx);});
 }
 window.TurmasVetor={getTurmas,getArquivadas,getAlunos,render,downloadTemplate,applyAssessment,syncFromSupabase:refreshCloud,refreshCloud};
 document.addEventListener('DOMContentLoaded',()=>{bind();render(); setTimeout(()=>{refreshCloud();},1200);});
})();
