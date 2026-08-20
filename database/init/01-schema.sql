CREATE TABLE curso (
    id_curso    SERIAL       PRIMARY KEY,
    nome_curso  VARCHAR(150) NOT NULL,
    CONSTRAINT uq_curso_nome UNIQUE (nome_curso)
);

CREATE TABLE conta (
    id_conta      SERIAL       PRIMARY KEY,
    email         VARCHAR(150) NOT NULL,
    senha_hash    VARCHAR(255) NOT NULL,
    tipo          VARCHAR(20)  NOT NULL,
    data_criacao  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_conta_email UNIQUE (email),
    CONSTRAINT ck_conta_tipo CHECK (tipo IN ('pesquisador', 'aluno', 'admin'))
);

CREATE TABLE aluno (
    id_aluno   SERIAL       PRIMARY KEY,
    id_conta   INT          NOT NULL,
    id_curso   INT          NOT NULL,
    nome       VARCHAR(150) NOT NULL,
    matricula  VARCHAR(30)  NOT NULL,
    CONSTRAINT uq_aluno_conta UNIQUE (id_conta),
    CONSTRAINT uq_aluno_matricula UNIQUE (matricula),
    CONSTRAINT fk_aluno_conta FOREIGN KEY (id_conta)
        REFERENCES conta (id_conta) ON DELETE RESTRICT,
    CONSTRAINT fk_aluno_curso FOREIGN KEY (id_curso)
        REFERENCES curso (id_curso) ON DELETE RESTRICT
);

CREATE TABLE pesquisador (
    id_pesquisador  SERIAL       PRIMARY KEY,
    id_conta        INT,
    nome            VARCHAR(150) NOT NULL,
    numero_lattes   VARCHAR(50)  NOT NULL,
    email           VARCHAR(150) NOT NULL,
    vinculo         VARCHAR(100) NOT NULL,
    origem          VARCHAR(100) NOT NULL,
    CONSTRAINT uq_pesquisador_conta UNIQUE (id_conta),
    CONSTRAINT uq_pesquisador_lattes UNIQUE (numero_lattes),
    CONSTRAINT ck_pesquisador_vinculo CHECK (vinculo IN ('docente', 'discente', 'externo')),
    CONSTRAINT ck_pesquisador_origem CHECK (origem IN ('lattes', 'dgp', 'manual')),
    CONSTRAINT fk_pesquisador_conta FOREIGN KEY (id_conta)
        REFERENCES conta (id_conta) ON DELETE SET NULL
);

CREATE TABLE edital (
    id_edital    SERIAL       PRIMARY KEY,
    nome_edital  VARCHAR(150) NOT NULL,
    ano          INT          NOT NULL,
    CONSTRAINT ck_edital_ano CHECK (ano BETWEEN 1990 AND 2100)
);

CREATE TABLE grupo_pesquisa (
    id_grupo     SERIAL       PRIMARY KEY,
    nome_grupo   VARCHAR(150) NOT NULL,
    link_dgp     VARCHAR(255),
    ano_criacao  INT          NOT NULL,
    CONSTRAINT uq_grupo_nome UNIQUE (nome_grupo),
    CONSTRAINT ck_grupo_ano CHECK (ano_criacao BETWEEN 1950 AND 2100)
);

CREATE TABLE projeto_pesquisa (
    id_projeto   SERIAL       PRIMARY KEY,
    id_grupo     INT          NOT NULL,
    id_edital    INT,
    titulo       VARCHAR(255) NOT NULL,
    resumo       TEXT,
    data_inicio  DATE         NOT NULL,
    data_fim     DATE,
    status       VARCHAR(30)  NOT NULL,
    origem       VARCHAR(100) NOT NULL,
    CONSTRAINT ck_projeto_status CHECK (status IN ('planejado', 'em_andamento', 'concluido', 'cancelado')),
    CONSTRAINT ck_projeto_origem CHECK (origem IN ('lattes', 'dgp', 'manual')),
    CONSTRAINT ck_projeto_periodo CHECK (data_fim IS NULL OR data_fim >= data_inicio),
    CONSTRAINT fk_projeto_grupo FOREIGN KEY (id_grupo)
        REFERENCES grupo_pesquisa (id_grupo) ON DELETE RESTRICT,
    CONSTRAINT fk_projeto_edital FOREIGN KEY (id_edital)
        REFERENCES edital (id_edital) ON DELETE SET NULL
);

CREATE TABLE area_conhecimento (
    id_area    SERIAL       PRIMARY KEY,
    nome_area  VARCHAR(150) NOT NULL,
    CONSTRAINT uq_area_nome UNIQUE (nome_area)
);

CREATE TABLE publicacao (
    id_publicacao  SERIAL       PRIMARY KEY,
    id_projeto     INT          NOT NULL,
    tipo           VARCHAR(50)  NOT NULL,
    ano            INT          NOT NULL,
    doi            VARCHAR(100),
    veiculo        VARCHAR(150) NOT NULL,
    titulo         VARCHAR(255) NOT NULL,
    CONSTRAINT uq_publicacao_doi UNIQUE (doi),
    CONSTRAINT ck_publicacao_tipo CHECK (tipo IN ('artigo', 'capitulo', 'resumo')),
    CONSTRAINT ck_publicacao_ano CHECK (ano BETWEEN 1950 AND 2100),
    CONSTRAINT fk_publicacao_projeto FOREIGN KEY (id_projeto)
        REFERENCES projeto_pesquisa (id_projeto) ON DELETE CASCADE
);

CREATE TABLE vaga (
    id_vaga        SERIAL       PRIMARY KEY,
    id_projeto     INT          NOT NULL,
    titulo         VARCHAR(150) NOT NULL,
    requisitos     TEXT,
    status         VARCHAR(30)  NOT NULL,
    qtd_vagas      INT          NOT NULL DEFAULT 1,
    data_abertura  DATE         NOT NULL,
    CONSTRAINT ck_vaga_status CHECK (status IN ('aberta', 'fechada')),
    CONSTRAINT ck_vaga_qtd CHECK (qtd_vagas > 0),
    CONSTRAINT fk_vaga_projeto FOREIGN KEY (id_projeto)
        REFERENCES projeto_pesquisa (id_projeto) ON DELETE CASCADE
);

CREATE TABLE membro (
    id_pesquisador  INT          NOT NULL,
    id_grupo        INT          NOT NULL,
    papel_grupo     VARCHAR(100) NOT NULL,
    CONSTRAINT pk_membro PRIMARY KEY (id_pesquisador, id_grupo),
    CONSTRAINT ck_membro_papel CHECK (papel_grupo IN ('lider', 'membro')),
    CONSTRAINT fk_membro_pesquisador FOREIGN KEY (id_pesquisador)
        REFERENCES pesquisador (id_pesquisador) ON DELETE CASCADE,
    CONSTRAINT fk_membro_grupo FOREIGN KEY (id_grupo)
        REFERENCES grupo_pesquisa (id_grupo) ON DELETE CASCADE
);

CREATE TABLE participacao (
    id_pesquisador  INT          NOT NULL,
    id_projeto      INT          NOT NULL,
    data_entrada    DATE         NOT NULL,
    papel           VARCHAR(100) NOT NULL,
    CONSTRAINT pk_participacao PRIMARY KEY (id_pesquisador, id_projeto),
    CONSTRAINT ck_participacao_papel CHECK (papel IN ('coordenador', 'participante')),
    CONSTRAINT fk_participacao_pesquisador FOREIGN KEY (id_pesquisador)
        REFERENCES pesquisador (id_pesquisador) ON DELETE CASCADE,
    CONSTRAINT fk_participacao_projeto FOREIGN KEY (id_projeto)
        REFERENCES projeto_pesquisa (id_projeto) ON DELETE CASCADE
);

CREATE TABLE possui_area (
    id_projeto  INT NOT NULL,
    id_area     INT NOT NULL,
    CONSTRAINT pk_possui_area PRIMARY KEY (id_projeto, id_area),
    CONSTRAINT fk_possui_area_projeto FOREIGN KEY (id_projeto)
        REFERENCES projeto_pesquisa (id_projeto) ON DELETE CASCADE,
    CONSTRAINT fk_possui_area_area FOREIGN KEY (id_area)
        REFERENCES area_conhecimento (id_area) ON DELETE RESTRICT
);

CREATE TABLE autoria (
    id_pesquisador  INT NOT NULL,
    id_publicacao   INT NOT NULL,
    ordem           INT NOT NULL,
    CONSTRAINT pk_autoria PRIMARY KEY (id_pesquisador, id_publicacao),
    CONSTRAINT ck_autoria_ordem CHECK (ordem > 0),
    CONSTRAINT uq_autoria_ordem UNIQUE (id_publicacao, ordem),
    CONSTRAINT fk_autoria_pesquisador FOREIGN KEY (id_pesquisador)
        REFERENCES pesquisador (id_pesquisador) ON DELETE CASCADE,
    CONSTRAINT fk_autoria_publicacao FOREIGN KEY (id_publicacao)
        REFERENCES publicacao (id_publicacao) ON DELETE CASCADE
);

CREATE TABLE candidatura (
    id_aluno           INT         NOT NULL,
    id_vaga            INT         NOT NULL,
    status             VARCHAR(30) NOT NULL,
    data_candidatura   DATE        NOT NULL,
    CONSTRAINT pk_candidatura PRIMARY KEY (id_aluno, id_vaga),
    CONSTRAINT ck_candidatura_status CHECK (status IN ('pendente', 'aprovada', 'rejeitada')),
    CONSTRAINT fk_candidatura_aluno FOREIGN KEY (id_aluno)
        REFERENCES aluno (id_aluno) ON DELETE CASCADE,
    CONSTRAINT fk_candidatura_vaga FOREIGN KEY (id_vaga)
        REFERENCES vaga (id_vaga) ON DELETE CASCADE
);

CREATE INDEX idx_aluno_curso ON aluno (id_curso);
CREATE INDEX idx_projeto_grupo ON projeto_pesquisa (id_grupo);
CREATE INDEX idx_projeto_edital ON projeto_pesquisa (id_edital);
CREATE INDEX idx_projeto_status ON projeto_pesquisa (status);
CREATE INDEX idx_publicacao_projeto ON publicacao (id_projeto);
CREATE INDEX idx_publicacao_ano ON publicacao (ano);
CREATE INDEX idx_vaga_projeto ON vaga (id_projeto);
CREATE INDEX idx_vaga_status ON vaga (status);
CREATE INDEX idx_membro_grupo ON membro (id_grupo);
CREATE INDEX idx_participacao_projeto ON participacao (id_projeto);
CREATE INDEX idx_possui_area_area ON possui_area (id_area);
CREATE INDEX idx_autoria_publicacao ON autoria (id_publicacao);
CREATE INDEX idx_candidatura_vaga ON candidatura (id_vaga);
