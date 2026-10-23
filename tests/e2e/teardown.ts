import { rmSync } from "node:fs";
import { adminClient, listedUsers, USERS_FILE } from "./admin";

/** Deletes every user the tests created (and any stray e2e+…@example.com users). */
export default async function teardown() {
  const a = adminClient();
  const made = new Set(listedUsers());
  let deleted = 0;
  for (let page = 1; page < 20; page++) {
    const { data } = await a.auth.admin.listUsers({ page, perPage: 200 });
    if (!data?.users.length) break;
    for (const u of data.users) {
      if (u.email && (made.has(u.email) || /^e2e\+.*@example\.com$/.test(u.email))) { await a.auth.admin.deleteUser(u.id); deleted++; }
    }
  }
  rmSync(USERS_FILE, { force: true });
  console.log(`teardown: deleted ${deleted} test users`);
}
