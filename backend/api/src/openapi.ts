import type { OpenAPIV3 } from "openapi-types";
import { OPENAPI_TAGS } from "./openapiTags.js";

export const openapi: OpenAPIV3.Document = {
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
            description:
              "Apenas em POST .../sessions: dia da semana da data vs dias planejados pelo personal (1=seg … 7=dom). Informativo; não bloqueia a sessão.",
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
            description:
              "`completed` exige todos os exercícios concluídos; `completed_partial` finaliza com pendências; `in_progress` reabre `abandoned`.",
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
        description:
          "Opcional: `workout_session_id` deve ser uma sessão do próprio aluno (`workout_sessions.id` com `student_id` = utilizador). Listar check-ins: **GET /me/check-ins** (aluno) ou **GET /professional/students/{student_id}/check-ins**.",
        properties: {
          check_in_date: { type: "string", example: "2026-05-04" },
          workout_session_id: { type: "string", format: "uuid", nullable: true },
        },
      },
      CheckInListItem: {
        type: "object",
        required: ["id", "check_in_date", "source", "created_at", "workout_session_id"],
        properties: {
          id: { type: "string", format: "uuid" },
          check_in_date: { type: "string", example: "2026-05-04" },
          source: { type: "string" },
          created_at: { type: "string", format: "date-time" },
          workout_session_id: { type: "string", format: "uuid", nullable: true },
        },
      },
      MeStudentCheckInsListResponse: {
        type: "object",
        required: ["check_ins"],
        properties: {
          check_ins: { type: "array", items: { $ref: "#/components/schemas/CheckInListItem" } },
        },
      },
      ProfessionalStudentCheckInsResponse: {
        type: "object",
        required: ["student_id", "check_ins"],
        properties: {
          student_id: { type: "string", format: "uuid" },
          check_ins: { type: "array", items: { $ref: "#/components/schemas/CheckInListItem" } },
        },
      },
      MeGamificationWeeklyDay: {
        type: "object",
        required: ["weekday", "date", "completed", "sources"],
        properties: {
          weekday: { type: "integer", minimum: 1, maximum: 7, description: "1=seg … 7=dom (ISO)" },
          date: { type: "string", example: "2026-05-04" },
          completed: { type: "boolean" },
          sources: {
            type: "array",
            items: { type: "string", enum: ["check_in", "workout"] },
          },
        },
      },
      MeGamificationWeeklyOverview: {
        type: "object",
        required: [
          "week_start",
          "week_end",
          "today_date",
          "today_weekday",
          "timezone",
          "streak_current",
          "streak_best",
          "days",
        ],
        properties: {
          week_start: { type: "string" },
          week_end: { type: "string" },
          today_date: { type: "string" },
          today_weekday: { type: "integer", minimum: 1, maximum: 7 },
          timezone: { type: "string" },
          streak_current: { type: "integer" },
          streak_best: { type: "integer" },
          days: { type: "array", items: { $ref: "#/components/schemas/MeGamificationWeeklyDay" } },
        },
      },
      ChallengeDto: {
        type: "object",
        required: ["id", "owner_professional_id", "name", "starts_on", "ends_on", "visibility", "status", "created_at", "updated_at"],
        properties: {
          id: { type: "string", format: "uuid" },
          owner_professional_id: { type: "string", format: "uuid" },
          name: { type: "string" },
          starts_on: { type: "string", example: "2026-05-01" },
          ends_on: { type: "string", example: "2026-05-31" },
          visibility: { type: "string", enum: ["private_ranking", "public_among_participants"] },
          status: { type: "string", enum: ["draft", "active", "ended"] },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      ChallengeParticipantAdmin: {
        type: "object",
        required: ["student_id", "status", "display_name", "invited_at", "responded_at"],
        properties: {
          student_id: { type: "string", format: "uuid" },
          status: { type: "string", enum: ["invited", "active", "declined"] },
          display_name: { type: "string", nullable: true },
          invited_at: { type: "string", format: "date-time" },
          responded_at: { type: "string", format: "date-time", nullable: true },
        },
      },
      ChallengeRankingRow: {
        type: "object",
        required: [
          "position",
          "student_id",
          "display_name",
          "active_days",
          "streak_current_in_challenge",
          "streak_best_in_challenge",
          "last_activity_date",
        ],
        properties: {
          position: { type: "integer" },
          student_id: { type: "string", format: "uuid" },
          display_name: { type: "string", nullable: true },
          active_days: { type: "integer" },
          streak_current_in_challenge: { type: "integer" },
          streak_best_in_challenge: { type: "integer" },
          last_activity_date: { type: "string", nullable: true, example: "2026-05-10" },
        },
      },
      PostProfessionalChallengeRequest: {
        type: "object",
        required: ["name", "starts_on", "ends_on"],
        properties: {
          name: { type: "string" },
          starts_on: { type: "string", example: "2026-05-01" },
          ends_on: { type: "string", example: "2026-05-31" },
          visibility: { type: "string", enum: ["private_ranking", "public_among_participants"] },
          status: { type: "string", enum: ["draft", "active"] },
        },
      },
      PatchProfessionalChallengeRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          starts_on: { type: "string" },
          ends_on: { type: "string" },
          visibility: { type: "string", enum: ["private_ranking", "public_among_participants"] },
          status: { type: "string", enum: ["draft", "active", "ended"] },
        },
      },
      PostChallengeParticipantsRequest: {
        type: "object",
        required: ["student_ids"],
        properties: {
          student_ids: { type: "array", items: { type: "string", format: "uuid" }, minItems: 1, maxItems: 100 },
        },
      },
      ProfessionalChallengesListResponse: {
        type: "object",
        required: ["challenges"],
        properties: {
          challenges: { type: "array", items: { $ref: "#/components/schemas/ChallengeDto" } },
        },
      },
      ProfessionalChallengeDetailResponse: {
        type: "object",
        required: ["challenge", "participants"],
        properties: {
          challenge: { $ref: "#/components/schemas/ChallengeDto" },
          participants: { type: "array", items: { $ref: "#/components/schemas/ChallengeParticipantAdmin" } },
        },
      },
      ChallengeRankingResponse: {
        type: "object",
        required: ["visibility", "ranking"],
        properties: {
          visibility: { type: "string", enum: ["private_ranking", "public_among_participants"] },
          ranking: { type: "array", items: { $ref: "#/components/schemas/ChallengeRankingRow" } },
        },
      },
      ChallengeReportResponse: {
        type: "object",
        required: [
          "challenge_id",
          "invited_count",
          "active_count",
          "declined_count",
          "average_active_days",
          "average_adherence_ratio",
          "challenge_day_span",
          "participants",
        ],
        properties: {
          challenge_id: { type: "string", format: "uuid" },
          invited_count: { type: "integer" },
          active_count: { type: "integer" },
          declined_count: { type: "integer" },
          average_active_days: { type: "number" },
          average_adherence_ratio: { type: "number" },
          challenge_day_span: { type: "integer" },
          participants: {
            type: "array",
            items: {
              type: "object",
              required: [
                "student_id",
                "display_name",
                "active_days",
                "streak_current_in_challenge",
                "last_activity_date",
                "streak_broken_hint",
              ],
              properties: {
                student_id: { type: "string", format: "uuid" },
                display_name: { type: "string", nullable: true },
                active_days: { type: "integer" },
                streak_current_in_challenge: { type: "integer" },
                last_activity_date: { type: "string", nullable: true },
                streak_broken_hint: { type: "boolean" },
              },
            },
          },
        },
      },
      MeChallengesListResponse: {
        type: "object",
        required: ["challenges"],
        properties: {
          challenges: {
            type: "array",
            items: {
              type: "object",
              required: ["challenge", "participant_status"],
              properties: {
                challenge: { $ref: "#/components/schemas/ChallengeDto" },
                participant_status: { type: "string", enum: ["invited", "active"] },
              },
            },
          },
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
    // [ACTUS — NOVO vs produção] auto-cadastro de profissional. Ver backend/CHANGES-FROM-PRODUCTION.md
    "/auth/register-professional": {
      post: {
        tags: ["Auth"],
        summary: "[ACTUS] Auto-cadastro de profissional (personal) — conta ativa + tokens",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "full_name", "phone"],
                properties: {
                  email: { type: "string", format: "email", maxLength: 320 },
                  password: { type: "string", minLength: 8, maxLength: 200 },
                  full_name: { type: "string", minLength: 3, maxLength: 200 },
                  phone: { type: "string", minLength: 6, maxLength: 40 },
                  lgpd_consent: { type: "boolean", enum: [true] },
                  policy_version: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Conta criada (tipo personal) + tokens",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthTokensResponse" } } },
          },
          "400": { description: "Erro de validação (`invalid_body`)", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "409": { description: "E-mail já usado (`email_already_in_use`)", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
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
        summary: "Criar ou reutilizar sessão para um dia (`scheduled_for_date`); idempotente por treino+dia; `schedule_hint` informa se o dia coincide com os `weekdays` planejados (não bloqueia)",
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
            description:
              "Exercícios pendentes ao marcar `completed` (`session_exercises_incomplete`), ou uso inválido de `completed_partial`",
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
    "/me/gamification/weekly-overview": {
      get: {
        tags: ["Gamificação"],
        summary: "Linha do tempo semanal + streak (dashboard aluno)",
        description: "Seg–Dom no fuso do aluno. `week_start` opcional (segunda YYYY-MM-DD); default = semana ISO atual.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "week_start",
            in: "query",
            required: false,
            schema: { type: "string", example: "2026-05-04" },
            description: "Deve ser uma segunda-feira",
          },
        ],
        responses: {
          "200": {
            description: "Overview",
            content: { "application/json": { schema: { $ref: "#/components/schemas/MeGamificationWeeklyOverview" } } },
          },
          "400": { description: "Query inválida", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Não é perfil aluno", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Perfil não encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/me/challenges": {
      get: {
        tags: ["Gamificação"],
        summary: "Listar desafios em que participo (convite ou ativo)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Lista",
            content: { "application/json": { schema: { $ref: "#/components/schemas/MeChallengesListResponse" } } },
          },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Não é perfil aluno", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/me/challenges/{challenge_id}/accept": {
      post: {
        tags: ["Gamificação"],
        summary: "Aceitar convite para um desafio",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "challenge_id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Ok", content: { "application/json": { schema: { type: "object", required: ["ok"], properties: { ok: { type: "boolean", enum: [true] } } } } } },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Não é perfil aluno", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Desafio não encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "409": { description: "Não convidado ou desafio encerrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/me/challenges/{challenge_id}/decline": {
      post: {
        tags: ["Gamificação"],
        summary: "Recusar convite",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "challenge_id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Ok", content: { "application/json": { schema: { type: "object", required: ["ok"], properties: { ok: { type: "boolean", enum: [true] } } } } } },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Não é perfil aluno", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Desafio não encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "409": { description: "Estado inválido", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/me/challenges/{challenge_id}/ranking": {
      get: {
        tags: ["Gamificação"],
        summary: "Ranking do desafio (só se visibilidade pública entre participantes)",
        description: "`403 ranking_private` quando o personal escolheu ranking privado.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "challenge_id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Ranking",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ChallengeRankingResponse" } } },
          },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Ranking privado ou sem permissão", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Desafio não encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
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
      get: {
        tags: ["Aluno — programa"],
        summary: "Listar check-ins do aluno autenticado",
        description: "Query opcional: from, to (YYYY-MM-DD), limit (1–500, def.: 120). Ordenação: data desc.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "from", in: "query", required: false, schema: { type: "string", example: "2026-01-01" } },
          { name: "to", in: "query", required: false, schema: { type: "string", example: "2026-12-31" } },
          { name: "limit", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 500, default: 120 } },
        ],
        responses: {
          "200": {
            description: "Lista",
            content: { "application/json": { schema: { $ref: "#/components/schemas/MeStudentCheckInsListResponse" } } },
          },
          "400": { description: "Query inválida", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Não é perfil aluno", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
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
          "400": {
            description: "Corpo inválido ou `workout_session_not_found` (UUID não é sessão deste aluno)",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Não é perfil aluno", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/professional/students/{student_id}/check-ins": {
      get: {
        tags: ["Profissional — alunos"],
        summary: "Listar check-ins de um aluno vinculado",
        description: "Requer vínculo ativo com o aluno. Mesmos filtros que GET /me/check-ins.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "student_id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "from", in: "query", required: false, schema: { type: "string", example: "2026-01-01" } },
          { name: "to", in: "query", required: false, schema: { type: "string", example: "2026-12-31" } },
          { name: "limit", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 500, default: 120 } },
        ],
        responses: {
          "200": {
            description: "Lista",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ProfessionalStudentCheckInsResponse" } } },
          },
          "400": { description: "UUID ou query inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Não é personal/nutricionista", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Aluno sem vínculo ativo", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
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
    "/professional/challenges": {
      get: {
        tags: ["Profissional — desafios"],
        summary: "Listar desafios criados pelo personal",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Lista",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ProfessionalChallengesListResponse" } } },
          },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Não é personal", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
      post: {
        tags: ["Profissional — desafios"],
        summary: "Criar desafio",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/PostProfessionalChallengeRequest" } } },
        },
        responses: {
          "201": {
            description: "Criado",
            content: {
              "application/json": {
                schema: { type: "object", required: ["challenge"], properties: { challenge: { $ref: "#/components/schemas/ChallengeDto" } } },
              },
            },
          },
          "400": { description: "Validação", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Não é personal", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/professional/challenges/{challenge_id}": {
      get: {
        tags: ["Profissional — desafios"],
        summary: "Detalhe + participantes",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "challenge_id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Detalhe",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ProfessionalChallengeDetailResponse" } } },
          },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Sem permissão", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Não encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
      patch: {
        tags: ["Profissional — desafios"],
        summary: "Atualizar desafio",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "challenge_id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/PatchProfessionalChallengeRequest" } } },
        },
        responses: {
          "200": {
            description: "Atualizado",
            content: {
              "application/json": { schema: { type: "object", required: ["challenge"], properties: { challenge: { $ref: "#/components/schemas/ChallengeDto" } } } },
            },
          },
          "400": { description: "Validação", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Sem permissão", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Não encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/professional/challenges/{challenge_id}/participants": {
      post: {
        tags: ["Profissional — desafios"],
        summary: "Convidar alunos (vínculo personal ativo)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "challenge_id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/PostChallengeParticipantsRequest" } } },
        },
        responses: {
          "200": {
            description: "Convites processados",
            content: {
              "application/json": {
                schema: { type: "object", required: ["invited_count"], properties: { invited_count: { type: "integer" } } },
              },
            },
          },
          "400": { description: "Validação ou alunos inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Sem permissão", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Desafio não encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "409": { description: "Desafio encerrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/professional/challenges/{challenge_id}/ranking": {
      get: {
        tags: ["Profissional — desafios"],
        summary: "Ranking completo (dono)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "challenge_id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Ranking",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ChallengeRankingResponse" } } },
          },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Sem permissão", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Desafio não encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/professional/challenges/{challenge_id}/report": {
      get: {
        tags: ["Profissional — desafios"],
        summary: "Relatório resumido (dono)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "challenge_id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Relatório",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ChallengeReportResponse" } } },
          },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Sem permissão", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Não encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    // [ACTUS-NEW] A3 — preview PÚBLICO de convite (sem security). Ver backend/CHANGES-FROM-PRODUCTION.md
    "/invites/{code}/preview": {
      get: {
        tags: ["Convites"],
        summary: "[ACTUS] Preview público de convite (passo 1 do cadastro, sem auth)",
        parameters: [{ name: "code", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Convite válido",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["ok"],
                  properties: {
                    ok: { type: "boolean", enum: [true] },
                    professional_display_name: { type: "string", nullable: true },
                    avatar_url: { type: "string", nullable: true },
                  },
                },
              },
            },
          },
          "404": { description: "`invalid_invite` / `invalid_invite_professional`", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "410": { description: "`invite_expired` / `invite_exhausted`", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
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

