<?php

use Illuminate\Support\Facades\Auth;

// The offline queue (resources/js/lib/offline/sync.js) relies on these two behaviours to
// send saved reports after the phone was offline long enough for the session to expire.

it('hands out a fresh CSRF cookie for the offline sync retry', function () {
    $this->get(route('sanctum.csrf-cookie'))
        ->assertNoContent()
        ->assertCookie('XSRF-TOKEN');
});

it('signs a remembered user back in after their session has expired', function () {
    $user = userWithRole('user');

    $login = $this->post('/login', ['email' => $user->email, 'password' => 'password', 'remember' => true]);
    $recaller = Auth::guard()->getRecallerName();
    $login->assertCookie($recaller);
    $rememberCookie = $login->getCookie($recaller, false)->getValue();

    // A new visit with only the remember cookie: no session, as after it expired.
    Auth::forgetGuards();
    $this->flushSession();

    // withCredentials: test JSON requests drop cookies otherwise (browsers send them same-origin).
    $this->withCredentials()
        ->withUnencryptedCookie($recaller, $rememberCookie)
        ->getJson(route('api.disaster.active'))
        ->assertOk();

    expect(Auth::id())->toBe($user->id);
});

it('still asks for a login when there is no remember cookie', function () {
    $user = userWithRole('user');
    $this->post('/login', ['email' => $user->email, 'password' => 'password']);

    Auth::forgetGuards();
    $this->flushSession();

    $this->withCredentials()->getJson(route('api.disaster.active'))->assertUnauthorized();
});
