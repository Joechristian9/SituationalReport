<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserTyping implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /** The only channels that exist; routes/channels.php registers these. */
    public const CHANNELS = [
        'weather-form-typing',
        'water-level-form-typing',
        'electricity-form-typing',
        'water-service-form-typing',
        'road-form-typing',
        'bridge-form-typing',
    ];

    public $userId;

    public $userName;

    public $fieldKey;

    public $isTyping;

    public $channelName;

    public function __construct($userId, $userName, $fieldKey, $isTyping, $channelName)
    {
        $this->userId = $userId;
        $this->userName = $userName;
        $this->fieldKey = $fieldKey;
        $this->isTyping = $isTyping;
        $this->channelName = $channelName;
    }

    public function broadcastOn()
    {
        return new PrivateChannel($this->channelName);
    }

    public function broadcastAs()
    {
        return 'typing';
    }

    public function broadcastWith()
    {
        return [
            'userId' => $this->userId,
            'userName' => $this->userName,
            'fieldKey' => $this->fieldKey,
            'isTyping' => $this->isTyping,
        ];
    }
}
