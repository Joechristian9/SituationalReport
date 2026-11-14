<?php

// A phone that remembers accounts for login without internet asks, whenever it gets a
// connection, whether they are still current (resources/js/lib/offline/staleAccounts.js).

function stampCheck(array $accounts)
{
    return test()->postJson(route('offline.accounts.check'), ['accounts' => $accounts]);
}

it('says an unchanged account is still current, without anyone logged in', function () {
    $user = userWithRole('user');

    stampCheck([['id' => $user->id, 'stamp' => $user->offlineStamp()]])->assertOk()->assertExactJson(['current' => [$user->id]]);
});

it('says an account is not current after its password changes or it is removed', function () {
    $changed = userWithRole('user');
    $removed = userWithRole('user');
    $kept = userWithRole('user');
    $pairs = collect([$changed, $removed, $kept])->map(fn ($u) => ['id' => $u->id, 'stamp' => $u->offlineStamp()])->all();

    $changed->update(['password' => 'a-new-long-password']);
    $removed->delete();

    stampCheck($pairs)->assertOk()->assertExactJson(['current' => [$kept->id]]);
});

it('answers the same for a wrong stamp and for an account that does not exist', function () {
    $user = userWithRole('user');
    $wrong = str_repeat('0', 64);

    stampCheck([['id' => $user->id, 'stamp' => $wrong]])->assertExactJson(['current' => []]);
    stampCheck([['id' => 999999, 'stamp' => $wrong]])->assertExactJson(['current' => []]);
});

it('rejects a malformed or oversized list', function () {
    stampCheck([['id' => 1, 'stamp' => 'short']])->assertStatus(422);
    stampCheck(array_fill(0, 21, ['id' => 1, 'stamp' => str_repeat('0', 64)]))->assertStatus(422);
    stampCheck([])->assertStatus(422);
});

it('limits how often one address may ask', function () {
    foreach (range(1, 30) as $i) {
        stampCheck([['id' => 1, 'stamp' => str_repeat('0', 64)]]);
    }

    stampCheck([['id' => 1, 'stamp' => str_repeat('0', 64)]])->assertStatus(429);
});
