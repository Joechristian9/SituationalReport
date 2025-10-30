<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('weather-form-typing', function ($user) {
    return Auth::check();
});

Broadcast::channel('water-level-form-typing', function ($user) {
    return Auth::check();
});

Broadcast::channel('electricity-form-typing', function ($user) {
    return Auth::check();
});

Broadcast::channel('water-service-form-typing', function ($user) {
    return Auth::check();
});

Broadcast::channel('road-form-typing', function ($user) {
    return Auth::check();
});

Broadcast::channel('bridge-form-typing', function ($user) {
    return Auth::check();
});
