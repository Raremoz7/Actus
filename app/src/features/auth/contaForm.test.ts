import {
  ContaAlunoFormSchema,
  ContaProfessorFormSchema,
  contaAlunoDefaults,
  contaProfessorDefaults,
  buildAlunoRegisterBody,
  buildProfessorRegisterBody,
  registerErrorField,
} from './contaForm';

const alunoOk = {
  full_name: 'Maria Silva',
  phone: '(11) 98888-7777',
  email: 'maria@exemplo.com',
  password: 'senha-forte',
  confirm_password: 'senha-forte',
  birth_date: '1995-03-20',
  invite_code: '',
};

describe('ContaAlunoFormSchema', () => {
  it('aceita conta válida (sem convite)', () => {
    expect(ContaAlunoFormSchema.safeParse(alunoOk).success).toBe(true);
  });
  it('telefone agora é OBRIGATÓRIO (mínimo 10 dígitos)', () => {
    expect(ContaAlunoFormSchema.safeParse({ ...alunoOk, phone: '' }).success).toBe(false);
    expect(ContaAlunoFormSchema.safeParse({ ...alunoOk, phone: '119' }).success).toBe(false);
  });
  it('nascimento obrigatório (exigência do backend real)', () => {
    expect(ContaAlunoFormSchema.safeParse({ ...alunoOk, birth_date: '' }).success).toBe(false);
  });
  it('convite vazio passa; preenchido valida base64url', () => {
    expect(ContaAlunoFormSchema.safeParse({ ...alunoOk, invite_code: 'AB!' }).success).toBe(false);
    expect(ContaAlunoFormSchema.safeParse({ ...alunoOk, invite_code: 'ACTUSDEMO' }).success).toBe(true);
  });
});

describe('buildAlunoRegisterBody', () => {
  it('com convite: envia invite_code; telefone vira dígitos', () => {
    const b = buildAlunoRegisterBody({ ...alunoOk, invite_code: 'ACTUSDEMO' });
    expect(b.invite_code).toBe('ACTUSDEMO');
    expect(b.phone).toBe('11988887777');
    expect(b.lgpd_consent).toBe(true);
  });
  it('sem convite: invite_code ausente (contrato proposto ao back)', () => {
    const b = buildAlunoRegisterBody(alunoOk);
    expect(b.invite_code).toBeUndefined();
  });
});

describe('ContaProfessorFormSchema / buildProfessorRegisterBody', () => {
  const profOk = {
    full_name: 'João Treina',
    phone: '(11) 97777-6666',
    email: 'joao@exemplo.com',
    password: 'senha-forte',
    confirm_password: 'senha-forte',
  };
  it('aceita conta válida (sem nascimento — fiel ao PDF)', () => {
    expect(ContaProfessorFormSchema.safeParse(profOk).success).toBe(true);
  });
  it('body proposto: sem birth_date, sem cref (vão depois)', () => {
    const b = buildProfessorRegisterBody(profOk);
    expect(b.full_name).toBe('João Treina');
    expect(b.phone).toBe('11977776666');
    expect('birth_date' in b).toBe(false);
  });
});

describe('registerErrorField (tela única: código → campo ou banner)', () => {
  it('email_already_in_use → campo email', () => {
    expect(registerErrorField('email_already_in_use')).toEqual({ campo: 'email' });
  });
  it('códigos de convite → banner form-level (copy específica)', () => {
    expect(registerErrorField('invite_expired')).toEqual({ formLevel: true });
  });
  it('invalid_body com fieldErrors → campo correspondente', () => {
    const r = registerErrorField('invalid_body', {
      details: { fieldErrors: { birth_date: ['Data inválida'] } },
    });
    expect(r).toEqual({ campo: 'birth_date', fieldMessage: 'Data inválida' });
  });
  it('desconhecido → banner', () => {
    expect(registerErrorField('internal_error')).toEqual({ formLevel: true });
  });
});

describe('defaults', () => {
  it('todos vazios', () => {
    expect(contaAlunoDefaults.invite_code).toBe('');
    expect(contaProfessorDefaults.full_name).toBe('');
  });
});
