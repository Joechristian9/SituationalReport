<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class PasswordController extends Controller
{
    /**
     * Update the user's password.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        // The account's other devices must sign in again with the new password; this one stays.
        // logoutOtherDevices() also renews this device's "Remember me" cookie for the new password.
        $request->user()->endSessions($request->session()->getId());
        Auth::logoutOtherDevices($validated['password']);
        $request->user()->rememberOfflinePassword($validated['password']);

        return back();
    }
}
