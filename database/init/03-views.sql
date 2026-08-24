CREATE OR REPLACE VIEW v_projetos_detalhados AS
SELECT
    pr.id_projeto,
    pr.titulo,
    pr.status,
    pr.data_inicio,
    pr.data_fim,
    g.id_grupo,
    g.nome_grupo,
    e.id_edital,
    e.nome_edital,
    e.ano AS ano_edital,
    COUNT(DISTINCT pu.id_publicacao)::int AS quantidade_publicacoes
FROM projeto_pesquisa pr
JOIN grupo_pesquisa g ON g.id_grupo = pr.id_grupo
LEFT JOIN edital e ON e.id_edital = pr.id_edital
LEFT JOIN publicacao pu ON pu.id_projeto = pr.id_projeto
GROUP BY
    pr.id_projeto,
    pr.titulo,
    pr.status,
    pr.data_inicio,
    pr.data_fim,
    g.id_grupo,
    g.nome_grupo,
    e.id_edital,
    e.nome_edital,
    e.ano;

CREATE OR REPLACE VIEW v_producao_bibliografica AS
SELECT
    pu.id_publicacao,
    pu.titulo AS titulo_publicacao,
    pu.tipo,
    pu.ano,
    pu.veiculo,
    pu.doi,
    pr.id_projeto,
    pr.titulo AS titulo_projeto,
    g.id_grupo,
    g.nome_grupo,
    pe.id_pesquisador,
    pe.nome AS nome_autor,
    au.ordem AS ordem_autor
FROM publicacao pu
JOIN projeto_pesquisa pr ON pr.id_projeto = pu.id_projeto
JOIN grupo_pesquisa g ON g.id_grupo = pr.id_grupo
LEFT JOIN autoria au ON au.id_publicacao = pu.id_publicacao
LEFT JOIN pesquisador pe ON pe.id_pesquisador = au.id_pesquisador;

CREATE OR REPLACE VIEW v_grupos_pesquisa AS
SELECT
    g.id_grupo,
    g.nome_grupo,
    g.ano_criacao,
    g.link_dgp,
    COALESCE(
        STRING_AGG(DISTINCT pe.nome, ', ' ORDER BY pe.nome)
            FILTER (WHERE m.papel_grupo = 'lider'),
        'Sem líder cadastrado'
    ) AS lideres,
    COUNT(DISTINCT m.id_pesquisador)::int AS quantidade_pesquisadores,
    COUNT(DISTINCT pr.id_projeto)::int AS quantidade_projetos,
    (COUNT(DISTINCT pr.id_projeto)
        FILTER (WHERE pr.status = 'em_andamento'))::int AS projetos_em_andamento
FROM grupo_pesquisa g
LEFT JOIN membro m ON m.id_grupo = g.id_grupo
LEFT JOIN pesquisador pe ON pe.id_pesquisador = m.id_pesquisador
LEFT JOIN projeto_pesquisa pr ON pr.id_grupo = g.id_grupo
GROUP BY
    g.id_grupo,
    g.nome_grupo,
    g.ano_criacao,
    g.link_dgp;
