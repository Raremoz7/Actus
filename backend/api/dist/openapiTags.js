/** Tags raiz do OpenAPI — ordem usada pelo Swagger UI (com tagsSorter implícito). */
export const OPENAPI_TAGS = [
    { name: "Auth", description: "Registro, login, tokens e senha" },
    { name: "Perfil", description: "Perfil do usuário autenticado" },
    {
        name: "Aluno — programa",
        description: "Treinos e dietas atribuídos ao aluno; execução de sessões (dietas só leitura)",
    },
    { name: "Convites", description: "Convites emitidos por profissionais" },
    { name: "Profissional — alunos", description: "Alunos vinculados ao profissional logado" },
    { name: "Treinos", description: "Templates de treino (personal)" },
    { name: "Atribuições — treinos", description: "Treinos atribuídos a alunos" },
    { name: "Dietas", description: "Templates de dieta (nutricionista)" },
    { name: "Atribuições — dietas", description: "Dietas atribuídas a alunos" },
    { name: "Admin — profissionais", description: "Gestão de profissionais (staff)" },
    { name: "Admin — vínculos", description: "Vínculos aluno ↔ profissional (staff)" },
    { name: "Admin — staff", description: "Usuários internos Actus (staff)" },
    { name: "Sistema", description: "Health e metadados da API" },
];
