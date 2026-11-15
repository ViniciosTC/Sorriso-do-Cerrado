import { db } from './db.js';
import { user, account, banners } from './schema.js';
import { eq, like } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';

export const criarAdminPadrao = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const adminEmail = (
    process.env.ADMIN_EMAIL || (isProduction ? undefined : 'admin@email.com')
  )?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || (isProduction ? undefined : 'Admin@123');

  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required in production');
  }

  try {
    const senhaHash = await hashPassword(adminPassword);

    const adminExiste = await db
      .select()
      .from(user)
      .where(eq(user.email, adminEmail));

    if (adminExiste.length > 0) {
      const existingUser = adminExiste[0];
      console.log(`Admin já existe: ${adminEmail}. Atualizando credenciais e papel...`);

      // Atualiza os dados do usuário admin
      await db
        .update(user)
        .set({
          name: 'Admin',
          papel: 'admin',
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(user.id, existingUser.id));

      // Verifica se o registro de credencial existe na tabela account
      const contaExiste = await db
        .select()
        .from(account)
        .where(eq(account.userId, existingUser.id));

      if (contaExiste.length > 0) {
        await db
          .update(account)
          .set({
            password: senhaHash,
            providerId: 'credential',
            accountId: existingUser.id,
            updatedAt: new Date(),
          })
          .where(eq(account.userId, existingUser.id));
      } else {
        await db.insert(account).values({
          id: crypto.randomUUID(),
          userId: existingUser.id,
          accountId: existingUser.id,
          providerId: 'credential',
          password: senhaHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      console.log(`Credenciais do admin atualizadas com sucesso: ${adminEmail}`);
      return;
    }

    const userId = crypto.randomUUID();
    const accountId = crypto.randomUUID();

    await db.insert(user).values({
      id: userId,
      name: 'Admin',
      email: adminEmail,
      papel: 'admin',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(account).values({
      id: accountId,
      userId: userId,
      accountId: userId,
      providerId: 'credential',
      password: senhaHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`Admin padrão criado com sucesso: ${adminEmail}`);
  } catch (err) {
    console.error('Erro ao criar admin:', err);
    throw err;
  }
};

export const criarBannersPadrao = async () => {
  // Começa com zero banners por padrão, permitindo que o admin adicione até 10 banners manualmente
};