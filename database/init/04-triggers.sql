-- ============================================================
-- GATILHO 1: Auditoria de publicações
-- Registra automaticamente toda inserção, alteração e exclusão
-- na tabela publicacao, guardando os dados antigos e novos.
-- ============================================================

CREATE TABLE auditoria_publicacao (
    id_auditoria     SERIAL       PRIMARY KEY,
    id_publicacao    INT          NOT NULL,
    operacao         VARCHAR(10)  NOT NULL,
    dados_antigos    JSONB,
    dados_novos      JSONB,
    usuario_banco    VARCHAR(100) NOT NULL DEFAULT current_user,
    data_ocorrencia  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_auditoria_operacao CHECK (operacao IN ('INSERT', 'UPDATE', 'DELETE'))
);

CREATE INDEX idx_auditoria_publicacao ON auditoria_publicacao (id_publicacao);

CREATE OR REPLACE FUNCTION fn_auditar_publicacao()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO auditoria_publicacao (id_publicacao, operacao, dados_novos)
        VALUES (NEW.id_publicacao, TG_OP, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO auditoria_publicacao (id_publicacao, operacao, dados_antigos, dados_novos)
        VALUES (NEW.id_publicacao, TG_OP, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSE
        INSERT INTO auditoria_publicacao (id_publicacao, operacao, dados_antigos)
        VALUES (OLD.id_publicacao, TG_OP, to_jsonb(OLD));
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auditar_publicacao
AFTER INSERT OR UPDATE OR DELETE ON publicacao
FOR EACH ROW
EXECUTE FUNCTION fn_auditar_publicacao();

-- ============================================================
-- GATILHO 2: Bloqueio de candidatura em vaga fechada
-- Garante no banco a regra de negócio: nenhuma candidatura
-- pode ser criada para uma vaga com status 'fechada'.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_bloquear_candidatura_vaga_fechada()
RETURNS TRIGGER AS $$
DECLARE
    v_status vaga.status%TYPE;
BEGIN
    SELECT status INTO v_status FROM vaga WHERE id_vaga = NEW.id_vaga;

    IF v_status = 'fechada' THEN
        RAISE EXCEPTION 'A vaga % está fechada e não aceita novas candidaturas.', NEW.id_vaga;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bloquear_candidatura_vaga_fechada
BEFORE INSERT ON candidatura
FOR EACH ROW
EXECUTE FUNCTION fn_bloquear_candidatura_vaga_fechada();

-- ============================================================
-- GATILHO 3: Fechamento automático de vaga preenchida
-- Quando o número de candidaturas aprovadas atinge qtd_vagas,
-- a vaga é fechada automaticamente.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_fechar_vaga_preenchida()
RETURNS TRIGGER AS $$
DECLARE
    v_aprovadas INT;
    v_qtd       INT;
BEGIN
    SELECT COUNT(*) INTO v_aprovadas
    FROM candidatura
    WHERE id_vaga = NEW.id_vaga AND status = 'aprovada';

    SELECT qtd_vagas INTO v_qtd FROM vaga WHERE id_vaga = NEW.id_vaga;

    IF v_aprovadas >= v_qtd THEN
        UPDATE vaga
        SET status = 'fechada'
        WHERE id_vaga = NEW.id_vaga AND status = 'aberta';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fechar_vaga_preenchida
AFTER INSERT OR UPDATE OF status ON candidatura
FOR EACH ROW
WHEN (NEW.status = 'aprovada')
EXECUTE FUNCTION fn_fechar_vaga_preenchida();
