<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Only admins have a dashboard; everyone else works from their report forms.
     * `dashboard` stays as the generic landing route (auth redirects, links), so it
     * forwards to the right home page and keeps any flash message for that page.
     */
    public function index(Request $request): RedirectResponse
    {
        $request->session()->reflash();

        return redirect()->route($request->user()->homeRoute());
    }
}
