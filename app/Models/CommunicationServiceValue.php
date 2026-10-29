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
        'status',
    ];

    // A status change counts as a change of its row, so another device's save over it is caught (RejectStaleEdits).
    protected $touches = ['communication'];

    public function communication()
    {
        return $this->belongsTo(Communication::class);
    }

    public function service()
    {
        return $this->belongsTo(CommunicationService::class, 'service_id');
    }
}
