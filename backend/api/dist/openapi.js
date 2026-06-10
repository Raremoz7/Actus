import { OPENAPI_TAGS } from "./openapiTags.js";
export const openapi = {
    openapi: "3.0.3",
    info: {
        title: "Actus API",
        version: "0.1.0",
    },
    servers: [{ url: "/" }],
    tags: [...OPENAPI_TAGS],
    components: {
        securitySchemes: {
            bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        },
        schemas: {
            ErrorResponse: {
                type: "object",
                properties: { error: { type: "string" } },
                required: ["error"],
                additionalProperties: true,
            },
            AuthRegisterRequest: {
                type: "object",
                required: ["invite_code", "email", "password", "full_name", "birth_date"],
                properties: {
                    invite_code: { type: "string" },
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 8 },
                    full_name: { type: "string" },
                    cpf: { type: "string", nullable: true },
                    birth_date: { type: "string", example: "1990-01-30" },
                    phone: { type: "string", nullable: true },
                    gender: { type: "string", enum: ["masculino", "feminino", "nao_informar", "outro"], nullable: true },
                    lgpd_consent: { type: "boolean", enum: [true], default: true },
                    policy_version: { type: "string", default: "v1" },
                },
            },
            AuthLoginRequest: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                },
            },
            AuthRefreshRequest: {
                type: "object",
                required: ["refresh_token"],
                properties: { refresh_token: { type: "string" } },
            },
            AuthTokensResponse: {
                type: "object",
                required: ["access_token", "access_token_expires_in", "refresh_token"],
                properties: {
                    access_token: { type: "string" },
                    access_token_expires_in: { type: "number" },
                    refresh_token: { type: "string" },
                    must_change_password: { type: "boolean", description: "Espelho opcional do claim JWT" },
                },
            },
            AuthChangePasswordRequest: {
                type: "object",
                required: ["current_password", "new_password"],
                properties: {
                    current_password: { type: "string" },
                    new_password: { type: "string", minLength: 8 },
                },
            },
            AuthChangePasswordResponse: {
                type: "object",
                required: ["access_token", "access_token_expires_in", "must_change_password"],
                properties: {
                    access_token: { type: "string" },
                    access_token_expires_in: { type: "number" },
                    must_change_password: { type: "boolean" },
                },
            },
            AdminCreateProfessionalRequest: {
                type: "object",
                required: [
                    "email",
                    "password",
                    "full_name",
                    "birth_date",
                    "professional_role",
                ],
                properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 8 },
                    full_name: { type: "string" },
                    professional_role: { type: "string", enum: ["personal", "nutricionista"] },
                    cpf: { type: "string", nullable: true },
                    birth_date: { type: "string", example: "1990-01-30" },
                    phone: { type: "string", nullable: true },
                    gender: { type: "string", enum: ["masculino", "feminino", "nao_informar", "outro"], nullable: true },
                    lgpd_consent: { type: "boolean", enum: [true], default: true },
                    policy_version: { type: "string", default: "v1" },
                    must_change_password: { type: "boolean", default: true },
                    cref_number: {
                        type: "string",
                        nullable: true,
                        description: "Opcional na criação. Quando professional_role=personal, pode ser omitido e preenchido depois via PATCH.",
                    },
                    cref_expires_at: { type: "string", nullable: true, example: "2030-12-31", description: "Só faz sentido se cref_number for enviado." },
                    crn_number: {
                        type: "string",
                        nullable: true,
                        description: "Opcional na criação. Quando professional_role=nutricionista, pode ser omitido e preenchido depois via PATCH.",
                    },
                    crn_expires_at: { type: "string", nullable: true, example: "2030-12-31", description: "Só faz sentido se crn_number for enviado." },
                },
            },
            AdminCreateProfessionalResponse: {
                type: "object",
                required: ["id", "email", "professional_role", "created_by"],
                properties: {
                    id: { type: "string", format: "uuid" },
                    email: { type: "string", format: "email" },
                    professional_role: { type: "string" },
                    created_by: { type: "string", format: "uuid" },
                },
            },
            CreateInviteRequest: {
                type: "object",
                required: ["expires_at"],
                properties: {
                    expires_at: { type: "string", format: "date-time" },
                    max_uses: { type: "integer", minimum: 1, default: 1 },
                },
            },
            CreateInviteResponse: {
                type: "object",
                required: ["id", "code"],
                properties: {
                    id: { type: "string", format: "uuid" },
                    code: { type: "string" },
                },
            },
            ListInvitesResponse: {
                type: "object",
                required: ["invites"],
                properties: {
                    invites: {
                        type: "array",
                        items: {
                            type: "object",
                            required: ["id", "code", "expires_at", "max_uses", "used_count", "created_at", "active"],
                            properties: {
                                id: { type: "string", format: "uuid" },
                                code: { type: "string" },
                                expires_at: { type: "string", format: "date-time" },
                                max_uses: { type: "integer" },
                                used_count: { type: "integer" },
                                created_at: { type: "string", format: "date-time" },
                                active: { type: "boolean" },
                            },
                        },
                    },
                },
            },
            MeResponse: {
                type: "object",
                required: ["id", "tipo"],
                properties: {
                    id: { type: "string", format: "uuid" },
                    tipo: { type: "string" },
                    display_name: { type: "string", nullable: true },
                },
            },
            ProfessionalStudentsResponse: {
                type: "object",
                required: ["students"],
                properties: {
                    students: {
                        type: "array",
                        items: {
                            type: "object",
                            required: ["id", "email", "professional_role", "linked_at"],
                            properties: {
                                id: { type: "string", format: "uuid" },
                                email: { type: "string", format: "email" },
                                full_name: { type: "string", nullable: true },
                                birth_date: { type: "string", nullable: true, example: "1995-10-01" },
                                professional_role: { type: "string", enum: ["personal", "nutricionista"] },
                                linked_at: { type: "string", format: "date-time" },
                            },
                        },
                    },
                },
            },
            AdminStudentLinksResponse: {
                type: "object",
                required: ["links"],
                properties: {
                    links: {
                        type: "array",
                        items: {
                            type: "object",
                            required: ["id", "student", "professional", "professional_role", "status", "linked_at"],
                            properties: {
                                id: { type: "string", format: "uuid" },
                                student: {
                                    type: "object",
                                    required: ["id", "email"],
                                    properties: {
                                        id: { type: "string", format: "uuid" },
                                        email: { type: "string", format: "email" },
                                        full_name: { type: "string", nullable: true },
                                        birth_date: { type: "string", nullable: true, example: "1995-10-01" },
                                    },
                                },
                                professional: {
                                    type: "object",
                                    required: ["id", "email", "tipo"],
                                    properties: {
                                        id: { type: "string", format: "uuid" },
                                        email: { type: "string", format: "email" },
                                        display_name: { type: "string", nullable: true },
                                        tipo: { type: "string" },
                                    },
                                },
                                professional_role: { type: "string", enum: ["personal", "nutricionista"] },
                                status: { type: "string", enum: ["active", "revoked"] },
                                linked_at: { type: "string", format: "date-time" },
                            },
                        },
                    },
                },
            },
            CreateWorkoutRequest: {
                type: "object",
                required: ["name", "exercises"],
                properties: {
                    name: { type: "string" },
                    notes: { type: "string", nullable: true },
                    exercises: {
                        type: "array",
                        items: {
                            type: "object",
                            required: ["position", "wger_exercise_id", "name_snapshot"],
                            properties: {
                                position: { type: "integer", minimum: 1 },
                                wger_exercise_id: { type: "integer", minimum: 1 },
                                name_snapshot: { type: "string" },
                                sets: { type: "integer", minimum: 1, default: 3 },
                                reps: { type: "integer", minimum: 1, default: 10 },
                                rest_seconds: { type: "integer", minimum: 0, default: 60 },
                                notes: { type: "string", nullable: true },
                            },
                        },
                    },
                },
            },
            CreateWorkoutResponse: {
                type: "object",
                required: ["ok", "workout_id"],
                properties: {
                    ok: { type: "boolean", enum: [true] },
                    workout_id: { type: "string", format: "uuid" },
                },
            },
            AssignWorkoutRequest: {
                type: "object",
                required: ["workout_id", "weekdays"],
                properties: {
                    workout_id: { type: "string", format: "uuid" },
                    weekdays: { type: "array", items: { type: "integer", minimum: 1, maximum: 7 } },
                    start_date: { type: "string", nullable: true, example: "2026-05-01" },
                    end_date: { type: "string", nullable: true, example: "2026-06-01" },
                    display_order: { type: "integer", default: 0 },
                    is_active: { type: "boolean", default: true },
                },
            },
            AssignWorkoutResponse: {
                type: "object",
                required: ["ok", "student_workout_id"],
                properties: {
                    ok: { type: "boolean", enum: [true] },
                    student_workout_id: { type: "string", format: "uuid" },
                },
            },
            CreateDietTemplateRequest: {
                type: "object",
                required: ["name"],
                properties: {
                    name: { type: "string" },
                    body: { type: "object", additionalProperties: true },
                },
            },
            CreateDietTemplateResponse: {
                type: "object",
                required: ["ok", "diet_template_id"],
                properties: {
                    ok: { type: "boolean", enum: [true] },
                    diet_template_id: { type: "string", format: "uuid" },
                },
            },
            AssignDietRequest: {
                type: "object",
                required: ["diet_template_id"],
                properties: {
                    diet_template_id: { type: "string", format: "uuid" },
                    start_date: { type: "string", nullable: true, example: "2026-05-01" },
                    is_active: { type: "boolean", default: true },
                },
            },
            AssignDietResponse: {
                type: "object",
                required: ["ok", "student_diet_id"],
                properties: {
                    ok: { type: "boolean", enum: [true] },
                    student_diet_id: { type: "string", format: "uuid" },
                },
            },
            PatchMeRequest: {
                type: "object",
                properties: {
                    display_name: { type: "string" },
                    avatar_url: { type: "string", format: "uri" },
                    timezone: { type: "string" },
                    full_name: { type: "string" },
                    phone: { type: "string", nullable: true },
                    gender: { type: "string", enum: ["masculino", "feminino", "nao_informar", "outro"] },
                    body_weight_kg: { type: "number", nullable: true, description: "Peso corporal (kg) para MET / calorias" },
                },
            },
            MeStudentWorkoutsListResponse: {
                type: "object",
                required: ["student_workouts"],
                properties: {
                    student_workouts: {
                        type: "array",
                        items: { type: "object", additionalProperties: true },
                    },
                },
            },
            MeStudentWorkoutDetailResponse: {
                type: "object",
                required: ["assignment", "workout", "recent_sessions"],
                properties: {
                    assignment: { type: "object", additionalProperties: true },
                    workout: { type: "object", additionalProperties: true },
                    recent_sessions: { type: "array", items: { type: "object", additionalProperties: true } },
                },
            },
            MeStudentWorkoutSessionPayload: {
                type: "object",
                required: ["session", "exercises"],
                properties: {
                    session: { type: "object", additionalProperties: true },
                    exercises: { type: "array", items: { type: "object", additionalProperties: true } },
                    schedule_hint: {
                        type: "object",
                        description: "Apenas em POST .../sessions: dia da semana da data vs dias planejados pelo personal (1=seg … 7=dom). Informativo; não bloqueia a sessão.",
                        properties: {
                            scheduled_weekday: { type: "integer", minimum: 1, maximum: 7 },
                            planned_weekdays: { type: "array", items: { type: "integer" } },
                            matches_planned_weekdays: { type: "boolean" },
                        },
                    },
                    summary: { type: "object", additionalProperties: true, description: "Presente após POST /finish" },
                },
            },
            MeStudentCreateSessionRequest: {
                type: "object",
                required: ["scheduled_for_date"],
                properties: {
                    scheduled_for_date: { type: "string", example: "2026-05-04", description: "YYYY-MM-DD (dia lógico do aluno)" },
                },
            },
            MeStudentPatchSessionRequest: {
                type: "object",
                required: ["status"],
                properties: {
                    status: {
                        type: "string",
                        enum: ["completed", "completed_partial", "abandoned", "in_progress"],
                        description: "`completed` exige todos os exercícios concluídos; `completed_partial` finaliza com pendências; `in_progress` reabre `abandoned`.",
                    },
                },
            },
            MeStudentFinishSessionRequest: {
                type: "object",
                properties: {
                    early_finish: { type: "boolean", default: false },
                    with_check_in: { type: "boolean", default: true },
                },
            },
            MeStudentPutSessionSetsRequest: {
                type: "object",
                required: ["sets"],
                properties: {
                    sets: {
                        type: "array",
                        items: {
                            type: "object",
                            required: ["set_index"],
                            properties: {
                                set_index: { type: "integer", minimum: 1 },
                                weight_kg: { type: "number", nullable: true },
                                reps_done: { type: "integer", nullable: true },
                                rest_seconds_actual: { type: "integer", nullable: true },
                            },
                        },
                    },
                },
            },
            MeStudentPostCheckInRequest: {
                type: "object",
                properties: {
                    check_in_date: { type: "string", example: "2026-05-04" },
                    workout_session_id: { type: "string", format: "uuid", nullable: true },
                },
            },
            MeStudentPatchSessionExerciseRequest: {
                type: "object",
                required: ["completed"],
                properties: { completed: { type: "boolean", enum: [true] } },
            },
            MeStudentDietsListResponse: {
                type: "object",
                required: ["diets"],
                properties: {
                    diets: { type: "array", items: { type: "object", additionalProperties: true } },
                },
            },
            MeStudentDietDetailResponse: {
                type: "object",
                required: ["id", "diet_template_id", "is_active", "created_at", "updated_at", "template_name", "template_body"],
                properties: {
                    id: { type: "string", format: "uuid" },
                    diet_template_id: { type: "string", format: "uuid" },
                    start_date: { type: "string", nullable: true },
                    is_active: { type: "boolean" },
                    created_at: { type: "string", format: "date-time" },
                    updated_at: { type: "string", format: "date-time" },
                    template_name: { type: "string" },
                    template_body: { type: "object", additionalProperties: true },
                },
            },
            WorkoutListItem: {
                type: "object",
                required: ["id", "name", "created_at", "exercise_count"],
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    notes: { type: "string", nullable: true },
                    created_at: { type: "string", format: "date-time" },
                    exercise_count: { type: "integer" },
                },
            },
            WorkoutDetail: {
                type: "object",
                required: ["id", "name", "created_at", "exercises"],
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    notes: { type: "string", nullable: true },
                    created_at: { type: "string", format: "date-time" },
                    exercises: { type: "array", items: { type: "object", additionalProperties: true } },
                },
            },
            PatchWorkoutRequest: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    notes: { type: "string", nullable: true },
                    exercises: { type: "array", items: { type: "object", additionalProperties: true } },
                },
            },
            DietTemplateListItem: {
                type: "object",
                required: ["id", "name", "created_at"],
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    created_at: { type: "string", format: "date-time" },
                },
            },
            DietTemplateDetail: {
                type: "object",
                required: ["id", "name", "body", "created_at"],
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    body: { type: "object", additionalProperties: true },
                    created_at: { type: "string", format: "date-time" },
                },
            },
            PatchDietTemplateRequest: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    body: { type: "object", additionalProperties: true },
                },
            },
            PatchStudentWorkoutRequest: {
                type: "object",
                properties: {
                    weekdays: { type: "array", items: { type: "integer", minimum: 1, maximum: 7 } },
                    start_date: { type: "string", nullable: true, example: "2026-05-01" },
                    end_date: { type: "string", nullable: true },
                    display_order: { type: "integer" },
                    is_active: { type: "boolean" },
                },
            },
            PatchStudentDietRequest: {
                type: "object",
                properties: {
                    diet_template_id: { type: "string", format: "uuid" },
                    start_date: { type: "string", nullable: true },
                    is_active: { type: "boolean" },
                },
            },
            PatchInviteRequest: {
                type: "object",
                properties: {
                    expires_at: { type: "string", format: "date-time" },
                    max_uses: { type: "integer", minimum: 1, maximum: 1000 },
                },
            },
            InviteDetail: {
                type: "object",
                required: ["id", "code", "expires_at", "max_uses", "used_count", "created_at", "active"],
                properties: {
                    id: { type: "string", format: "uuid" },
                    code: { type: "string" },
                    expires_at: { type: "string", format: "date-time" },
                    max_uses: { type: "integer" },
                    used_count: { type: "integer" },
                    created_at: { type: "string", format: "date-time" },
                    active: { type: "boolean" },
                },
            },
            PatchAdminLinkRequest: {
                type: "object",
                required: ["status"],
                properties: { status: { type: "string", enum: ["active", "revoked"] } },
            },
            PatchAdminProfessionalRequest: {
                type: "object",
                properties: {
                    display_name: { type: "string" },
                    email: { type: "string", format: "email" },
                    must_change_password: { type: "boolean" },
                    full_name: { type: "string" },
                    phone: { type: "string", nullable: true },
                    gender: { type: "string", enum: ["masculino", "feminino", "nao_informar", "outro"] },
                    birth_date: { type: "string", example: "1990-01-30" },
                    cpf: { type: "string", nullable: true },
                    cref_number: { type: "string", nullable: true },
                    cref_expires_at: { type: "string", nullable: true },
                    crn_number: { type: "string", nullable: true },
                    crn_expires_at: { type: "string", nullable: true },
                },
            },
            AdminStaffMember: {
                type: "object",
                required: ["id", "email", "display_name", "tipo", "staff_roles"],
                properties: {
                    id: { type: "string", format: "uuid" },
                    email: { type: "string", format: "email" },
                    display_name: { type: "string", nullable: true },
                    tipo: { type: "string" },
                    staff_roles: { type: "array", items: { type: "string" } },
                },
            },
            AdminStaffListResponse: {
                type: "object",
                required: ["staff"],
                properties: { staff: { type: "array", items: { $ref: "#/components/schemas/AdminStaffMember" } } },
            },
            PatchAdminStaffRequest: {
                type: "object",
                properties: {
                    display_name: { type: "string" },
                    email: { type: "string", format: "email" },
                    must_change_password: { type: "boolean" },
                    full_name: { type: "string" },
                    phone: { type: "string", nullable: true },
                    gender: { type: "string", enum: ["masculino", "feminino", "nao_informar", "outro"] },
                    staff_roles: { type: "array", items: { type: "string", enum: ["actus_admin", "actus_suporte"] } },
                },
            },
        },
    },
    paths: {
        "/health": {
            get: {
                tags: ["Sistema"],
                summary: "Healthcheck",
                responses: {
                    "200": {
                        description: "OK",
                        content: { "application/json": { schema: { type: "object", properties: { ok: { type: "boolean" } } } } },
                    },
                },
            },
        },
        "/openapi.json": {
            get: {
                tags: ["Sistema"],
                summary: "OpenAPI spec",
                responses: { "200": { description: "OpenAPI document" } },
            },
        },
        "/auth/register": {
            post: {
                tags: ["Auth"],
                summary: "Cadastro (somente com convite)",
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/AuthRegisterRequest" } } },
                },
                responses: {
                    "201": {
                        description: "Tokens",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/AuthTokensResponse" } } },
                    },
                    "400": { description: "Erro de validação/convite", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "409": { description: "Email/CPF já usado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/auth/login": {
            post: {
                tags: ["Auth"],
                summary: "Login",
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/AuthLoginRequest" } } },
                },
                responses: {
                    "200": {
                        description: "Tokens",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/AuthTokensResponse" } } },
                    },
                    "401": { description: "Credenciais inválidas", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/auth/refresh": {
            post: {
                tags: ["Auth"],
                summary: "Renovar tokens",
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/AuthRefreshRequest" } } },
                },
                responses: {
                    "200": {
                        description: "Tokens",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/AuthTokensResponse" } } },
                    },
                    "401": { description: "Refresh inválido", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/auth/logout": {
            post: {
                tags: ["Auth"],
                summary: "Logout (revoga refresh token)",
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/AuthRefreshRequest" } } },
                },
                responses: {
                    "204": { description: "Revogado" },
                },
            },
        },
        "/auth/change-password": {
            post: {
                tags: ["Auth"],
                summary: "Trocar senha (autenticado; libera o restante da API se must_change_password)",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/AuthChangePasswordRequest" } } },
                },
                responses: {
                    "200": {
                        description: "Novo access token",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/AuthChangePasswordResponse" } } },
                    },
                    "400": { description: "Validação", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "401": { description: "Senha atual incorreta", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/me": {
            get: {
                tags: ["Perfil"],
                summary: "Perfil do usuário logado",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": { description: "Me", content: { "application/json": { schema: { $ref: "#/components/schemas/MeResponse" } } } },
                    "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "Conta bloqueada até trocar senha", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
            patch: {
                operationId: "patchMeProfile",
                tags: ["Perfil"],
                summary: "PATCH — Atualizar perfil (parcial)",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/PatchMeRequest" } } },
                },
                responses: {
                    "200": { description: "Atualizado", content: { "application/json": { schema: { $ref: "#/components/schemas/MeResponse" } } } },
                    "400": { description: "Validação", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "must_change_password", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "404": { description: "Perfil não encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/me/workouts": {
            get: {
                tags: ["Aluno — programa"],
                summary: "Listar treinos atribuídos ao aluno",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "is_active",
                        in: "query",
                        required: false,
                        schema: { type: "boolean" },
                        description: "Filtra por `student_workouts.is_active`",
                    },
                ],
                responses: {
                    "200": {
                        description: "Lista de atribuições",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/MeStudentWorkoutsListResponse" } } },
                    },
                    "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "Não é perfil aluno (`forbidden_not_student`)", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/me/workouts/{student_workout_id}": {
            get: {
                tags: ["Aluno — programa"],
                summary: "Detalhe da atribuição + exercícios do template + sessões recentes",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "student_workout_id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                responses: {
                    "200": {
                        description: "Detalhe",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/MeStudentWorkoutDetailResponse" } } },
                    },
                    "400": { description: "UUID inválido", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "Não é perfil aluno", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "404": { description: "Atribuição não encontrada", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/me/workouts/{student_workout_id}/sessions": {
            post: {
                tags: ["Aluno — programa"],
                summary: "Criar ou reutilizar sessão para um dia (`scheduled_for_date`); idempotente por treino+dia",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "student_workout_id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/MeStudentCreateSessionRequest" } } },
                },
                responses: {
                    "200": {
                        description: "Sessão criada ou já existente",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/MeStudentWorkoutSessionPayload" } } },
                    },
                    "400": {
                        description: "Corpo inválido ou treino inativo (`student_workout_inactive`)",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                    "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "Não é perfil aluno", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "404": { description: "Atribuição não encontrada", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/me/workouts/sessions/{session_id}": {
            get: {
                tags: ["Aluno — programa"],
                summary: "Obter sessão e exercícios",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "session_id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                responses: {
                    "200": {
                        description: "Payload da sessão",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/MeStudentWorkoutSessionPayload" } } },
                    },
                    "400": { description: "UUID inválido", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "Não é perfil aluno", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "404": { description: "Sessão não encontrada", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
            patch: {
                tags: ["Aluno — programa"],
                summary: "Concluir, abandonar ou reabrir sessão",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "session_id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/MeStudentPatchSessionRequest" } } },
                },
                responses: {
                    "200": {
                        description: "Sessão atualizada",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/MeStudentWorkoutSessionPayload" } } },
                    },
                    "400": {
                        description: "Exercícios pendentes ao marcar `completed` (`session_exercises_incomplete`), ou uso inválido de `completed_partial`",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                    "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "Não é perfil aluno", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "404": { description: "Sessão não encontrada", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "409": {
                        description: "Transição inválida de estado",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
        },
        "/me/workouts/sessions/{session_id}/finish": {
            post: {
                tags: ["Aluno — programa"],
                summary: "Finalizar sessão + check-in opcional + resumo (calorias, share DTO)",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "session_id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                requestBody: {
                    required: false,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/MeStudentFinishSessionRequest" } } },
                },
                responses: {
                    "200": {
                        description: "Sessão finalizada; corpo inclui `summary`",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/MeStudentWorkoutSessionPayload" } } },
                    },
                    "400": { description: "Treino incompleto sem early_finish", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "Não é perfil aluno", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "404": { description: "Sessão não encontrada", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "409": { description: "Estado não finalizável", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/me/workouts/sessions/{session_id}/start": {
            post: {
                tags: ["Aluno — programa"],
                summary: "Iniciar treino (atualiza started_at)",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "session_id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                responses: {
                    "200": { description: "Sessão atualizada", content: { "application/json": { schema: { $ref: "#/components/schemas/MeStudentWorkoutSessionPayload" } } } },
                    "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "Não é perfil aluno", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "404": { description: "Sessão não encontrada", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "409": { description: "Não inicia em `session_not_startable`", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/me/workouts/sessions/{session_id}/exercises/{workout_exercise_id}/sets": {
            put: {
                tags: ["Aluno — programa"],
                summary: "Substituir séries registradas de um exercício",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "session_id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
                    { name: "workout_exercise_id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
                ],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/MeStudentPutSessionSetsRequest" } } },
                },
                responses: {
                    "200": { description: "Sessão atualizada", content: { "application/json": { schema: { $ref: "#/components/schemas/MeStudentWorkoutSessionPayload" } } } },
                    "400": { description: "Validação", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "Não é perfil aluno", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "404": { description: "Sessão ou exercício", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "409": { description: "Sessão não editável", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/me/workouts/sessions/{session_id}/exercises/{workout_exercise_id}": {
            patch: {
                tags: ["Aluno — programa"],
                summary: "Marcar exercício da sessão como concluído",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "session_id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
                    { name: "workout_exercise_id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
                ],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/MeStudentPatchSessionExerciseRequest" } } },
                },
                responses: {
                    "200": {
                        description: "Sessão após atualização",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/MeStudentWorkoutSessionPayload" } } },
                    },
                    "400": { description: "Corpo inválido", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "Não é perfil aluno", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "404": {
                        description: "Sessão ou vínculo exercício/sessão inexistente",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                    "409": {
                        description: "Sessão não está `in_progress` (`session_not_editable`)",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
        },
        "/me/diets": {
            get: {
                tags: ["Aluno — programa"],
                summary: "Listar dietas atribuídas (somente leitura)",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Lista",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/MeStudentDietsListResponse" } } },
                    },
                    "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "Não é perfil aluno", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/me/diets/{student_diet_id}": {
            get: {
                tags: ["Aluno — programa"],
                summary: "Detalhe da dieta atribuída",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "student_diet_id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                responses: {
                    "200": {
                        description: "Detalhe",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/MeStudentDietDetailResponse" } } },
                    },
                    "400": { description: "UUID inválido", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "Não é perfil aluno", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "404": { description: "Dieta não encontrada", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/me/check-ins": {
            post: {
                tags: ["Aluno — programa"],
                summary: "Check-in diário (idempotente por data local)",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: false,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/MeStudentPostCheckInRequest" } } },
                },
                responses: {
                    "201": {
                        description: "Data aplicada; `created` indica novo registro",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["check_in_date", "created"],
                                    properties: {
                                        check_in_date: { type: "string" },
                                        created: { type: "boolean" },
                                    },
                                },
                            },
                        },
                    },
                    "400": { description: "Validação", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "Não é perfil aluno", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/professional/students": {
            get: {
                tags: ["Profissional — alunos"],
                summary: "Listar alunos vinculados (profissional)",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Lista",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ProfessionalStudentsResponse" } } },
                    },
                    "403": { description: "Sem permissão / must_change_password", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/invites": {
            get: {
                tags: ["Convites"],
                summary: "Listar convites (profissional)",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Lista",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ListInvitesResponse" } } },
                    },
                    "403": { description: "Sem permissão / must_change_password", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
            post: {
                tags: ["Convites"],
                summary: "Criar convite (profissional)",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/CreateInviteRequest" } } },
                },
                responses: {
                    "201": { description: "Convite criado", content: { "application/json": { schema: { $ref: "#/components/schemas/CreateInviteResponse" } } } },
                    "403": { description: "Sem permissão / limite atingido / must_change_password", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/invites/consume": {
            post: {
                tags: ["Convites"],
                summary: "Consumir convite (aluno autenticado)",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": { schema: { type: "object", required: ["code"], properties: { code: { type: "string" } } } },
                    },
                },
                responses: {
                    "200": { description: "Vínculo criado ou já existente", content: { "application/json": { schema: { type: "object", additionalProperties: true } } } },
                    "400": { description: "Convite inválido", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "must_change_password", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/invites/{invite_id}": {
            patch: {
                operationId: "patchInviteById",
                tags: ["Convites"],
                summary: "PATCH — Atualizar metadados do convite (emissor)",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "invite_id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/PatchInviteRequest" } } },
                },
                responses: {
                    "200": { description: "Convite", content: { "application/json": { schema: { $ref: "#/components/schemas/InviteDetail" } } } },
                    "400": { description: "Validação", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "Sem permissão", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "404": { description: "Não encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/admin/links/students": {
            get: {
                tags: ["Admin — vínculos"],
                summary: "Listar vínculos aluno↔profissional (admin/suporte)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "professional_id", in: "query", required: false, schema: { type: "string", format: "uuid" } },
                    { name: "professional_role", in: "query", required: false, schema: { type: "string", enum: ["personal", "nutricionista"] } },
                    { name: "status", in: "query", required: false, schema: { type: "string", enum: ["active", "revoked"], default: "active" } },
                ],
                responses: {
                    "200": {
                        description: "Links",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/AdminStudentLinksResponse" } } },
                    },
                    "400": { description: "Query inválida", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "Sem papel interno / must_change_password", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/admin/links/students/{link_id}": {
            patch: {
                operationId: "patchAdminStudentLink",
                tags: ["Admin — vínculos"],
                summary: "PATCH — Atualizar status do vínculo aluno↔profissional",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "link_id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/PatchAdminLinkRequest" } } },
                },
                responses: {
                    "200": { description: "Atualizado", content: { "application/json": { schema: { type: "object", additionalProperties: true } } } },
                    "400": { description: "Validação", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "Sem papel interno", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "404": { description: "Vínculo não encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "409": { description: "Conflito (ex.: outro vínculo ativo no mesmo papel)", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/workouts": {
            get: {
                tags: ["Treinos"],
                summary: "Listar treinos do personal logado",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Lista",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["workouts"],
                                    properties: { workouts: { type: "array", items: { $ref: "#/components/schemas/WorkoutListItem" } } },
                                },
                            },
                        },
                    },
                    "403": { description: "Somente personal", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
            post: {
                tags: ["Treinos"],
                summary: "Criar treino (personal) com exercícios",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/CreateWorkoutRequest" } } },
                },
                responses: {
                    "201": { description: "Criado", content: { "application/json": { schema: { $ref: "#/components/schemas/CreateWorkoutResponse" } } } },
                    "400": { description: "Validação", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "Somente personal / must_change_password", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/workouts/{workout_id}": {
            get: {
                tags: ["Treinos"],
                summary: "Detalhe do treino (template + exercícios)",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "workout_id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                responses: {
                    "200": { description: "Treino", content: { "application/json": { schema: { $ref: "#/components/schemas/WorkoutDetail" } } } },
                    "403": { description: "Somente personal", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "404": { description: "Não encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
            patch: {
                operationId: "patchWorkoutById",
                tags: ["Treinos"],
                summary: "PATCH — Atualizar treino (parcial; exercises substitui lista)",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "workout_id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/PatchWorkoutRequest" } } },
                },
                responses: {
                    "200": { description: "Atualizado", content: { "application/json": { schema: { $ref: "#/components/schemas/WorkoutDetail" } } } },
                    "400": { description: "Validação", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "Sem permissão", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "404": { description: "Não encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/students/{student_id}/workouts": {
            post: {
                tags: ["Atribuições — treinos"],
                summary: "Atribuir treino ao aluno (personal)",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "student_id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/AssignWorkoutRequest" } } },
                },
                responses: {
                    "201": { description: "Atribuído", content: { "application/json": { schema: { $ref: "#/components/schemas/AssignWorkoutResponse" } } } },
                    "400": { description: "Validação", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "Sem vínculo / workout não pertence / must_change_password", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/students/{student_id}/workouts/{student_workout_id}": {
            patch: {
                operationId: "patchStudentWorkoutAssignment",
                tags: ["Atribuições — treinos"],
                summary: "PATCH — Atualizar atribuição de treino",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "student_id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
                    { name: "student_workout_id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
                ],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/PatchStudentWorkoutRequest" } } },
                },
                responses: {
                    "200": { description: "Atualizado", content: { "application/json": { schema: { type: "object", additionalProperties: true } } } },
                    "400": { description: "Validação", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "Sem permissão", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "404": { description: "Não encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/diet-templates": {
            get: {
                tags: ["Dietas"],
                summary: "Listar templates de dieta do nutricionista logado",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Lista",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["diet_templates"],
                                    properties: { diet_templates: { type: "array", items: { $ref: "#/components/schemas/DietTemplateListItem" } } },
                                },
                            },
                        },
                    },
                    "403": { description: "Somente nutricionista", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
            post: {
                tags: ["Dietas"],
                summary: "Criar dieta (nutricionista)",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/CreateDietTemplateRequest" } } },
                },
                responses: {
                    "201": { description: "Criado", content: { "application/json": { schema: { $ref: "#/components/schemas/CreateDietTemplateResponse" } } } },
                    "400": { description: "Validação", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "Somente nutri / must_change_password", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/diet-templates/{diet_template_id}": {
            get: {
                tags: ["Dietas"],
                summary: "Detalhe do template de dieta",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "diet_template_id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                responses: {
                    "200": { description: "Template", content: { "application/json": { schema: { $ref: "#/components/schemas/DietTemplateDetail" } } } },
                    "403": { description: "Sem permissão", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "404": { description: "Não encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
            patch: {
                operationId: "patchDietTemplateById",
                tags: ["Dietas"],
                summary: "PATCH — Atualizar template de dieta (parcial)",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "diet_template_id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/PatchDietTemplateRequest" } } },
                },
                responses: {
                    "200": { description: "Atualizado", content: { "application/json": { schema: { $ref: "#/components/schemas/DietTemplateDetail" } } } },
                    "400": { description: "Validação", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "Sem permissão", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "404": { description: "Não encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/students/{student_id}/diets": {
            post: {
                tags: ["Atribuições — dietas"],
                summary: "Atribuir dieta ao aluno (nutricionista)",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "student_id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/AssignDietRequest" } } },
                },
                responses: {
                    "201": { description: "Atribuído", content: { "application/json": { schema: { $ref: "#/components/schemas/AssignDietResponse" } } } },
                    "400": { description: "Validação", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "Sem vínculo / template não pertence / must_change_password", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/students/{student_id}/diets/{student_diet_id}": {
            patch: {
                operationId: "patchStudentDietAssignment",
                tags: ["Atribuições — dietas"],
                summary: "PATCH — Atualizar atribuição de dieta",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "student_id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
                    { name: "student_diet_id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
                ],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/PatchStudentDietRequest" } } },
                },
                responses: {
                    "200": { description: "Atualizado", content: { "application/json": { schema: { type: "object", additionalProperties: true } } } },
                    "400": { description: "Validação", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "Sem permissão", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "404": { description: "Não encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/admin/professionals": {
            post: {
                tags: ["Admin — profissionais"],
                summary: "Criar profissional (admin/suporte, sem convite)",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/AdminCreateProfessionalRequest" } } },
                },
                responses: {
                    "201": {
                        description: "Criado",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/AdminCreateProfessionalResponse" } } },
                    },
                    "400": { description: "Validação", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "Sem papel interno / must_change_password", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "409": { description: "Email/CPF duplicado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/admin/professionals/{user_id}": {
            patch: {
                operationId: "patchAdminProfessionalById",
                tags: ["Admin — profissionais"],
                summary: "PATCH — Atualizar profissional (personal/nutri) — parcial",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "user_id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/PatchAdminProfessionalRequest" } } },
                },
                responses: {
                    "200": { description: "Atualizado", content: { "application/json": { schema: { type: "object", additionalProperties: true } } } },
                    "400": { description: "Validação", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "Sem papel interno", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "404": { description: "Profissional não encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "409": { description: "Email/CPF duplicado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/admin/staff": {
            get: {
                tags: ["Admin — staff"],
                summary: "Listar usuários internos (staff)",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "limit", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 500, default: 100 } }],
                responses: {
                    "200": { description: "Lista", content: { "application/json": { schema: { $ref: "#/components/schemas/AdminStaffListResponse" } } } },
                    "403": { description: "Sem papel interno", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
        "/admin/staff/{user_id}": {
            patch: {
                operationId: "patchAdminStaffById",
                tags: ["Admin — staff"],
                summary: "PATCH — Atualizar staff interno (papéis só actus_admin)",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "user_id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: { $ref: "#/components/schemas/PatchAdminStaffRequest" } } },
                },
                responses: {
                    "200": { description: "Atualizado", content: { "application/json": { schema: { type: "object", additionalProperties: true } } } },
                    "400": { description: "Validação", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "403": { description: "Sem permissão", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "404": { description: "Não encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                    "409": { description: "Email duplicado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                },
            },
        },
    },
};
