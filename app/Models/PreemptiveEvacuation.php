<?php
// app/Models/PreemptiveEvacuation.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PreemptiveEvacuation extends Model
{
    use HasFactory;

    protected $fillable = [
        'municipality',
        'barangay',
        'evacuated_families',
        'evacuated_individuals',
        'reason',
        'user_id',
        'updated_by',
    ];
}
