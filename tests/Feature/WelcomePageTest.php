<?php

use Inertia\Testing\AssertableInertia as Assert;

it('does not tell visitors which Laravel or PHP version runs the site', function () {
    $this->get(route('welcome'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Welcome')
            ->missing('laravelVersion')
            ->missing('phpVersion'));
});
