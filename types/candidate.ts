export interface CandidatoData {
    sq_candidato: bigint;
    nm_candidato: string;
    nm_urna_candidato: string;
    nr_candidato: number;
    sg_partido: string;
    img_candidato?: string;
    ano_eleicao?: number;
    cd_cargo?: number;
    ds_cargo?: string;
    nr_partido?: number;
    total_votos?: number;
    ds_sit_tot_turno?: string;
    ds_grau_instrucao?: string;
    cd_cor_raca?: number;
    ds_cor_raca?: string;
    cd_ocupacao?: number;
    ds_ocupacao?: string;
}
