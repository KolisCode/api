/**
 * Stub de `@faker-js/faker` para los tests e2e.
 *
 * faker se distribuye como ESM puro y rompe el runtime CommonJS de Jest. Solo
 * se usa dentro de `ToolsService.mockUsers` (endpoint `/v1/mock/users`), que no
 * forma parte de esta batería e2e, así que basta con un doble determinista que
 * provea la misma forma pública (`Faker`, `en`, `es`).
 */
export class Faker {
  constructor(_options?: unknown) {}
  seed(_value?: number): void {}

  readonly person = {
    firstName: () => 'Test',
    lastName: () => 'User',
    jobTitle: () => 'Developer',
  };
  readonly internet = {
    username: () => 'testuser',
    email: () => 'test@example.com',
  };
  readonly image = { avatarGitHub: () => 'https://example.com/avatar.png' };
  readonly phone = { number: () => '+10000000000' };
  readonly location = { country: () => 'Testland', city: () => 'Testville' };
  readonly string = { uuid: () => '00000000-0000-4000-8000-000000000000' };
  readonly date = { past: () => new Date(0) };
}

export const en = {};
export const es = {};
