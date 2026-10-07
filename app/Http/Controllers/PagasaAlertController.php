<?php

namespace App\Http\Controllers;

use App\Services\PagasaAlerts;
use Illuminate\Http\JsonResponse;

class PagasaAlertController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(PagasaAlerts::current());
    }
}
