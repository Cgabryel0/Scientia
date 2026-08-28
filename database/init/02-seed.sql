CREATE UNLOGGED TABLE carga_pessoa (
    seq    INT PRIMARY KEY,
    nome   VARCHAR(150) NOT NULL,
    email  VARCHAR(150) NOT NULL
);

INSERT INTO carga_pessoa (seq, nome, email)
SELECT
    i,
    pn.v || ' ' || mn.v || ' ' || sn.v,
    translate(lower(pn.v), 'áàâãéêíóôõúüç', 'aaaaeeiooouuc') || '.'
        || translate(lower(sn.v), 'áàâãéêíóôõúüç', 'aaaaeeiooouuc') || '@ufape.edu.br'
FROM generate_series(1, 170) AS s(i)
CROSS JOIN LATERAL (
    SELECT (ARRAY[
        'Ana', 'Bruno', 'Carla', 'Diego', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique',
        'Isabela', 'João', 'Karina', 'Lucas', 'Mariana', 'Nathalia', 'Otávio', 'Paula',
        'Rafael', 'Sabrina', 'Thiago', 'Vanessa', 'William', 'Yasmin', 'André', 'Beatriz',
        'Caio', 'Daniela', 'Emanuel', 'Fernanda', 'Gustavo', 'Helena', 'Igor', 'Juliana',
        'Kaique', 'Larissa', 'Marcelo', 'Natália', 'Pedro', 'Renata', 'Sérgio', 'Tatiana'
    ])[1 + (i * 7) % 40]
) AS pn(v)
CROSS JOIN LATERAL (
    SELECT (ARRAY[
        'de Souza', 'dos Santos', 'da Silva', 'de Oliveira', 'Ferreira', 'Barbosa',
        'Cavalcanti', 'de Melo', 'Nogueira', 'Ramos', 'Torres', 'Vasconcelos', 'Xavier',
        'Almeida', 'Bezerra', 'Coelho', 'Duarte', 'Guimarães', 'Lins', 'Moura', 'Peixoto'
    ])[1 + (i * 11) % 21]
) AS mn(v)
CROSS JOIN LATERAL (
    SELECT (ARRAY[
        'Albuquerque', 'Andrade', 'Aragão', 'Batista', 'Bandeira', 'Brandão', 'Campos',
        'Cardoso', 'Carvalho', 'Correia', 'Costa', 'Dantas', 'Fonseca', 'Freitas',
        'Galvão', 'Gomes', 'Leite', 'Lima', 'Lopes', 'Macedo', 'Machado', 'Maia',
        'Marinho', 'Martins', 'Mendonça', 'Monteiro', 'Morais', 'Nascimento', 'Neves',
        'Pacheco', 'Pereira', 'Pinheiro', 'Rocha', 'Rodrigues', 'Sales', 'Siqueira',
        'Tavares', 'Teixeira', 'Valadares', 'Viana', 'Wanderley'
    ])[1 + (i * 13) % 41]
) AS sn(v);

INSERT INTO curso (id_curso, nome_curso) VALUES
    (1,  'Bacharelado em Ciência da Computação'),
    (2,  'Bacharelado em Agronomia'),
    (3,  'Bacharelado em Zootecnia'),
    (4,  'Bacharelado em Medicina Veterinária'),
    (5,  'Bacharelado em Ciências Econômicas'),
    (6,  'Bacharelado em Administração'),
    (7,  'Bacharelado em Engenharia de Alimentos'),
    (8,  'Licenciatura em Ciências Biológicas'),
    (9,  'Licenciatura em Pedagogia'),
    (10, 'Licenciatura em Letras'),
    (11, 'Licenciatura em Física'),
    (12, 'Licenciatura em Matemática'),
    (13, 'Licenciatura em Química'),
    (14, 'Licenciatura em História'),
    (15, 'Mestrado em Produção Vegetal'),
    (16, 'Mestrado em Ciência Animal'),
    (17, 'Mestrado em Ciência e Tecnologia de Alimentos'),
    (18, 'Mestrado em Educação Contemporânea');

INSERT INTO area_conhecimento (id_area, nome_area) VALUES
    (1,  'Inteligência Artificial'),
    (2,  'Aprendizado de Máquina'),
    (3,  'Engenharia de Software'),
    (4,  'Banco de Dados'),
    (5,  'Redes de Computadores'),
    (6,  'Segurança da Informação'),
    (7,  'Computação Gráfica'),
    (8,  'Visão Computacional'),
    (9,  'Processamento de Linguagem Natural'),
    (10, 'Sistemas Distribuídos'),
    (11, 'Computação em Nuvem'),
    (12, 'Internet das Coisas'),
    (13, 'Sistemas Embarcados'),
    (14, 'Interação Humano-Computador'),
    (15, 'Informática na Educação'),
    (16, 'Ciência de Dados'),
    (17, 'Algoritmos e Otimização'),
    (18, 'Teoria da Computação'),
    (19, 'Arquitetura de Computadores'),
    (20, 'Robótica'),
    (21, 'Bioinformática'),
    (22, 'Jogos Digitais'),
    (23, 'Computação de Alto Desempenho'),
    (24, 'Métodos Formais');

INSERT INTO conta (id_conta, email, senha_hash, tipo, data_criacao)
SELECT
    p.seq,
    p.email,
    md5('scientia#' || p.seq),
    CASE WHEN p.seq <= 90 THEN 'aluno' ELSE 'pesquisador' END,
    TIMESTAMP '2026-01-08 09:00:00' + (p.seq * INTERVAL '11 hours')
FROM carga_pessoa p
WHERE p.seq <= 145;

INSERT INTO conta (id_conta, email, senha_hash, tipo, data_criacao)
SELECT
    145 + i,
    'admin' || i || '@ufape.edu.br',
    md5('scientia#admin' || i),
    'admin',
    TIMESTAMP '2026-01-05 08:00:00' + (i * INTERVAL '1 hour')
FROM generate_series(1, 5) AS s(i);

INSERT INTO aluno (id_aluno, id_conta, id_curso, nome, matricula)
SELECT
    p.seq,
    p.seq,
    CASE WHEN p.seq % 10 < 7 THEN 1 ELSE 2 + (p.seq * 5) % 17 END,
    p.nome,
    (2021 + (p.seq % 5))::text || lpad(p.seq::text, 6, '0')
FROM carga_pessoa p
WHERE p.seq <= 90;

INSERT INTO pesquisador (id_pesquisador, id_conta, nome, numero_lattes, email, vinculo, origem)
SELECT
    p.seq - 90,
    CASE WHEN p.seq <= 145 THEN p.seq ELSE NULL END,
    p.nome,
    (1000000000000000::bigint + p.seq * 733961)::text,
    p.email,
    CASE
        WHEN (p.seq - 90) % 10 <= 5 THEN 'docente'
        WHEN (p.seq - 90) % 10 <= 8 THEN 'discente'
        ELSE 'externo'
    END,
    CASE (p.seq - 90) % 3 WHEN 0 THEN 'lattes' WHEN 1 THEN 'dgp' ELSE 'manual' END
FROM carga_pessoa p
WHERE p.seq > 90;

INSERT INTO edital (id_edital, nome_edital, ano)
SELECT
    i,
    (ARRAY[
        'Edital Universal',
        'Programa Institucional de Bolsas de Iniciação Científica',
        'Chamada Pública de Apoio à Pesquisa',
        'Programa de Apoio a Núcleos de Excelência',
        'Edital de Infraestrutura Laboratorial',
        'Programa Institucional de Bolsas de Iniciação Tecnológica',
        'Chamada de Pesquisa em Desenvolvimento Regional',
        'Edital de Apoio a Grupos Emergentes',
        'Programa de Cooperação Acadêmica',
        'Chamada de Inovação e Transferência de Tecnologia',
        'Edital de Popularização da Ciência',
        'Programa de Apoio à Pós-Graduação'
    ])[1 + (i * 7) % 12] || ' nº ' || lpad((1 + (i * 3) % 40)::text, 2, '0') || '/' || (2018 + i % 9),
    2018 + i % 9
FROM generate_series(1, 60) AS s(i);

INSERT INTO grupo_pesquisa (id_grupo, nome_grupo, link_dgp, ano_criacao)
SELECT
    i,
    (ARRAY[
        'Grupo de Pesquisa em ',
        'Núcleo de Estudos em ',
        'Laboratório de Pesquisa em '
    ])[1 + i % 3]
    || (ARRAY[
        'Inteligência Artificial Aplicada',
        'Engenharia de Software',
        'Ciência de Dados',
        'Redes e Sistemas Distribuídos',
        'Segurança Cibernética',
        'Visão Computacional',
        'Processamento de Linguagem Natural',
        'Jogos e Entretenimento Digital',
        'Informática na Educação',
        'Computação de Alto Desempenho',
        'Sistemas Embarcados e Internet das Coisas',
        'Interação Humano-Computador',
        'Banco de Dados e Recuperação de Informação',
        'Métodos Formais e Verificação',
        'Robótica Inteligente',
        'Tecnologia da Informação para o Semiárido',
        'Bioinformática',
        'Algoritmos e Otimização',
        'Computação em Nuvem',
        'Teoria da Computação'
    ])[1 + i % 20],
    'http://dgp.cnpq.br/dgp/espelhogrupo/' || (1000000 + i * 37),
    2005 + i % 20
FROM generate_series(1, 55) AS s(i);

INSERT INTO projeto_pesquisa (id_projeto, id_grupo, id_edital, titulo, resumo, data_inicio, data_fim, status, origem)
SELECT
    i,
    1 + (i * 13) % 55,
    CASE WHEN i % 4 = 0 THEN NULL ELSE 1 + (i * 7) % 60 END,
    ac.v || ' ' || tm.v || ' ' || ct.v,
    'Este projeto investiga aspectos de ' || tm.v || ' ' || ct.v || ', com foco em '
        || (ARRAY[
            'desempenho e escalabilidade',
            'qualidade de software',
            'acessibilidade e usabilidade',
            'reprodutibilidade dos experimentos',
            'impacto social da tecnologia',
            'formação de recursos humanos em computação',
            'transferência de tecnologia'
        ])[1 + (i * 5) % 7]
        || '. A metodologia prevê '
        || (ARRAY[
            'experimentos controlados e análise estatística',
            'desenvolvimento iterativo com validação por usuários',
            'revisão sistemática da literatura',
            'modelagem computacional e simulação',
            'treinamento e avaliação de modelos com dados reais',
            'estudo de caso em ambiente de produção',
            'prototipação e testes de campo'
        ])[1 + (i * 3) % 7] || '.',
    DATE '2018-02-01' + ((i * 23) % 2500),
    CASE
        WHEN i % 10 = 0 OR (i % 10 BETWEEN 1 AND 5) THEN NULL
        ELSE DATE '2018-02-01' + ((i * 23) % 2500) + (365 + (i * 7) % 400)
    END,
    CASE
        WHEN i % 10 = 0 THEN 'planejado'
        WHEN i % 10 = 9 THEN 'cancelado'
        WHEN i % 10 <= 5 THEN 'em_andamento'
        ELSE 'concluido'
    END,
    CASE i % 3 WHEN 0 THEN 'lattes' WHEN 1 THEN 'dgp' ELSE 'manual' END
FROM generate_series(1, 120) AS s(i)
CROSS JOIN LATERAL (
    SELECT (ARRAY[
        'Avaliação de', 'Caracterização de', 'Análise de', 'Desenvolvimento de',
        'Monitoramento de', 'Modelagem de', 'Diagnóstico de', 'Otimização de',
        'Mapeamento de', 'Validação de'
    ])[1 + i % 10]
) AS ac(v)
CROSS JOIN LATERAL (
    SELECT (ARRAY[
        'sistemas de recomendação',
        'redes neurais profundas',
        'técnicas de aprendizado de máquina',
        'arquiteturas de microsserviços',
        'práticas de desenvolvimento ágil',
        'bancos de dados NoSQL',
        'segurança em aplicações web',
        'redes definidas por software',
        'visão computacional',
        'modelos de linguagem natural',
        'sistemas embarcados de baixo custo',
        'interfaces acessíveis',
        'objetos de aprendizagem digitais',
        'pipelines de ciência de dados',
        'algoritmos de otimização',
        'computação em nuvem',
        'dispositivos de Internet das Coisas',
        'testes automatizados de software',
        'jogos educacionais digitais',
        'mineração de dados educacionais',
        'visualização de dados científicos'
    ])[1 + i % 21]
) AS tm(v)
CROSS JOIN LATERAL (
    SELECT (ARRAY[
        'no Agreste Pernambucano',
        'em Garanhuns',
        'no semiárido nordestino',
        'em escolas públicas do Agreste',
        'no laboratório de computação da UFAPE',
        'em aplicações móveis',
        'em ambientes de nuvem',
        'na agricultura de precisão',
        'em sistemas de saúde digital',
        'no monitoramento ambiental da Caatinga',
        'em plataformas de ensino a distância',
        'em comunidades do interior de Pernambuco',
        'em sistemas legados de instituições públicas'
    ])[1 + i % 13]
) AS ct(v);

INSERT INTO publicacao (id_publicacao, id_projeto, tipo, ano, doi, veiculo, titulo)
SELECT
    i,
    1 + (i * 11) % 120,
    CASE WHEN i % 5 <= 2 THEN 'artigo' WHEN i % 5 = 3 THEN 'capitulo' ELSE 'resumo' END,
    2018 + i % 9,
    '10.' || (5000 + i % 40) || '/scientia.' || (2018 + i % 9) || '.' || i,
    (ARRAY[
        'Anais do Simpósio Brasileiro de Banco de Dados',
        'Anais do Congresso Brasileiro de Software',
        'Anais do Simpósio Brasileiro de Engenharia de Software',
        'Anais do Simpósio Brasileiro de Redes de Computadores',
        'Anais do Simpósio Brasileiro de Informática na Educação',
        'Anais do Encontro Nacional de Inteligência Artificial e Computacional',
        'Anais do Simpósio Brasileiro de Sistemas de Informação',
        'Journal of the Brazilian Computer Society',
        'Journal of Systems and Software',
        'IEEE Access',
        'Expert Systems with Applications',
        'Information and Software Technology',
        'Revista Brasileira de Informática na Educação',
        'Computers & Education',
        'Software: Practice and Experience'
    ])[1 + (i * 7) % 15],
    (ARRAY[
        'Efeitos de', 'Um estudo sobre', 'Impactos de', 'Análise comparativa de',
        'Aplicação de', 'Contribuições para', 'Perspectivas de', 'Indicadores de',
        'Revisão sistemática sobre'
    ])[1 + (i * 2) % 9]
    || ' '
    || (ARRAY[
        'sistemas de recomendação',
        'redes neurais profundas',
        'técnicas de aprendizado de máquina',
        'arquiteturas de microsserviços',
        'práticas de desenvolvimento ágil',
        'bancos de dados NoSQL',
        'segurança em aplicações web',
        'redes definidas por software',
        'visão computacional',
        'modelos de linguagem natural',
        'sistemas embarcados de baixo custo',
        'interfaces acessíveis',
        'objetos de aprendizagem digitais',
        'pipelines de ciência de dados',
        'algoritmos de otimização',
        'computação em nuvem',
        'dispositivos de Internet das Coisas',
        'testes automatizados de software',
        'jogos educacionais digitais',
        'mineração de dados educacionais',
        'visualização de dados científicos'
    ])[1 + (i * 5) % 21]
    || ' '
    || (ARRAY[
        'em um estudo de caso real',
        'com dados abertos governamentais',
        'em ambiente de produção',
        'em escala experimental',
        'no contexto de instituições públicas de ensino',
        'com avaliação por usuários',
        'em dispositivos de baixo custo'
    ])[1 + (i * 4) % 7]
FROM generate_series(1, 200) AS s(i);

INSERT INTO vaga (id_vaga, id_projeto, titulo, requisitos, status, qtd_vagas, data_abertura)
SELECT
    i,
    1 + (i * 17) % 120,
    (ARRAY[
        'Bolsista PIBIC', 'Bolsista PIBITI', 'Voluntário PIVIC', 'Bolsista de Extensão',
        'Estagiário de Pesquisa', 'Bolsista PIBIC-Af', 'Auxiliar de Laboratório',
        'Bolsista de Iniciação Tecnológica'
    ])[1 + (i * 3) % 8],
    (ARRAY[
        'Estar regularmente matriculado em curso de graduação da UFAPE.',
        'Disponibilidade de 20 horas semanais e coeficiente de rendimento acima de 7,0.',
        'Conhecimento básico em Python e estruturas de dados.',
        'Noções de Git, bancos de dados e desenvolvimento web.',
        'Interesse em aprendizado de máquina e análise de dados.',
        'Não possuir vínculo empregatício e manter currículo Lattes atualizado.'
    ])[1 + (i * 5) % 6],
    CASE WHEN i % 3 = 0 THEN 'fechada' ELSE 'aberta' END,
    1 + i % 3,
    DATE '2024-01-10' + ((i * 13) % 700)
FROM generate_series(1, 90) AS s(i);

INSERT INTO membro (id_pesquisador, id_grupo, papel_grupo)
SELECT
    1 + ((g.id_grupo * 7 + k * 23) % 80),
    g.id_grupo,
    CASE WHEN k = 0 THEN 'lider' ELSE 'membro' END
FROM grupo_pesquisa g
CROSS JOIN generate_series(0, 2) AS s(k);

INSERT INTO participacao (id_pesquisador, id_projeto, data_entrada, papel)
SELECT
    1 + ((pr.id_projeto * 13 + k * 29) % 80),
    pr.id_projeto,
    pr.data_inicio + (k * 30),
    CASE WHEN k = 0 THEN 'coordenador' ELSE 'participante' END
FROM projeto_pesquisa pr
CROSS JOIN generate_series(0, 2) AS s(k);

INSERT INTO possui_area (id_projeto, id_area)
SELECT
    pr.id_projeto,
    1 + ((pr.id_projeto * 5 + k * 11) % 24)
FROM projeto_pesquisa pr
CROSS JOIN generate_series(0, 1) AS s(k);

INSERT INTO autoria (id_pesquisador, id_publicacao, ordem)
SELECT
    1 + ((pb.id_publicacao * 19 + k * 31) % 80),
    pb.id_publicacao,
    k + 1
FROM publicacao pb
CROSS JOIN generate_series(0, 2) AS s(k);

INSERT INTO candidatura (id_aluno, id_vaga, status, data_candidatura)
SELECT
    1 + ((v.id_vaga * 3 + k * 37) % 90),
    v.id_vaga,
    CASE (v.id_vaga + k) % 3 WHEN 0 THEN 'pendente' WHEN 1 THEN 'aprovada' ELSE 'rejeitada' END,
    v.data_abertura + (5 + k * 3)
FROM vaga v
CROSS JOIN generate_series(0, 2) AS s(k);

INSERT INTO area_publicacao (id_publicacao, id_area)
SELECT
    pb.id_publicacao,
    1 + ((pb.id_publicacao * 7 + k * 13) % 24)
FROM publicacao pb
CROSS JOIN generate_series(0, 1) AS s(k);

SELECT setval(pg_get_serial_sequence('curso', 'id_curso'), (SELECT MAX(id_curso) FROM curso));
SELECT setval(pg_get_serial_sequence('conta', 'id_conta'), (SELECT MAX(id_conta) FROM conta));
SELECT setval(pg_get_serial_sequence('aluno', 'id_aluno'), (SELECT MAX(id_aluno) FROM aluno));
SELECT setval(pg_get_serial_sequence('pesquisador', 'id_pesquisador'), (SELECT MAX(id_pesquisador) FROM pesquisador));
SELECT setval(pg_get_serial_sequence('edital', 'id_edital'), (SELECT MAX(id_edital) FROM edital));
SELECT setval(pg_get_serial_sequence('grupo_pesquisa', 'id_grupo'), (SELECT MAX(id_grupo) FROM grupo_pesquisa));
SELECT setval(pg_get_serial_sequence('projeto_pesquisa', 'id_projeto'), (SELECT MAX(id_projeto) FROM projeto_pesquisa));
SELECT setval(pg_get_serial_sequence('area_conhecimento', 'id_area'), (SELECT MAX(id_area) FROM area_conhecimento));
SELECT setval(pg_get_serial_sequence('publicacao', 'id_publicacao'), (SELECT MAX(id_publicacao) FROM publicacao));
SELECT setval(pg_get_serial_sequence('vaga', 'id_vaga'), (SELECT MAX(id_vaga) FROM vaga));

DROP TABLE carga_pessoa;
