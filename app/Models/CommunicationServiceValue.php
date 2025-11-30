<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommunicationServiceValue extends Model
{
    use HasFactory;

    protected $fillable = [
        'communication_id',
        'service_id',
        'status'
    ];

    public function communication()
    {
        return $this->belongsTo(Communication::class);
    }

    public function service()
    {
        return $this->belongsTo(CommunicationService::class, 'service_id');
    }
}
