<?php

use App\Providers\AppServiceProvider;

it('sends the browser protections and hides the PHP version', function () {
    $this->get(route('login'))
        ->assertOk()
        ->assertHeader('X-Frame-Options', 'SAMEORIGIN')
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeaderMissing('X-Powered-By');
});

it('builds https links on the live site, where requests can arrive as http behind the CDN', function () {
    $this->app['env'] = 'production';
    (new AppServiceProvider($this->app))->boot();

    expect(route('dashboard'))->toStartWith('https://');
});

it('keeps plain http links for local development', function () {
    expect(app()->isProduction())->toBeFalse()
        ->and(route('dashboard'))->toStartWith('http://');
});
