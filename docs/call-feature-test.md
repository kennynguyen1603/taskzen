# Call Feature Testing Guide

## Overview

This guide helps you test the newly implemented audio and video call features in the chat application. Before testing in production, please make sure the backend API is properly configured to handle WebRTC signaling and call management.

## Prerequisites

1. Make sure you have the ringtone.mp3 file in the `/public/sounds/` directory
2. Verify that the backend API routes for call management are operational
3. Ensure WebSocket connection is working properly

## Testing Steps

### 1. Basic Call Functionality

1. **Initiate an Audio Call**:

   - Open a chat conversation with another user
   - Click the phone icon in the top bar
   - Verify the call dialog appears with your camera off
   - Verify the API request to `/calls` is made with `call_type: "audio"`

2. **Initiate a Video Call**:

   - Open a chat conversation with another user
   - Click the video icon in the top bar
   - Verify the call dialog appears with your camera on
   - Verify the API request to `/calls` is made with `call_type: "video"`

3. **Receive a Call**:

   - Have another user call you
   - Verify the incoming call notification appears
   - Verify you hear the ringtone
   - Accept the call and verify the call dialog opens
   - Verify the API request to `/calls/join` is made

4. **End a Call**:
   - During an active call, click the end call button
   - Verify the call ends and dialog closes
   - Verify the API request to `/calls/{room_id}` is made with DELETE method

### 2. WebRTC Functionality

1. **Audio Controls**:

   - During a call, click the microphone button
   - Verify your microphone is muted/unmuted
   - Verify the other participant can/cannot hear you

2. **Video Controls** (for video calls):

   - During a video call, click the camera button
   - Verify your camera is turned on/off
   - Verify the other participant can/cannot see you

3. **Screen Sharing** (for video calls):
   - During a video call, click the screen sharing button
   - Select a screen/window to share
   - Verify the other participant can see your shared screen
   - Click the button again to stop sharing
   - Verify the API requests to `/calls/screen-share` and `/calls/screen-share/{room_id}/{conversation_id}` are made

### 3. Edge Cases

1. **Busy User**:

   - Try calling a user who is already in a call
   - Verify you receive an appropriate message

2. **Rejected Call**:

   - Have someone reject your call
   - Verify you receive a "Call declined" notification

3. **Network Issues**:

   - Simulate network connectivity problems
   - Verify the call attempts to reconnect
   - Verify appropriate error messages are shown

4. **Multiple Participants**:
   - Test with more than two participants if group calls are supported
   - Verify all participants can see and hear each other

## Troubleshooting

If you encounter issues with the call feature, check the following:

1. **Browser Console**: Look for any JavaScript errors
2. **Network Tab**: Verify API requests are being made with correct parameters
3. **Browser Permissions**: Ensure microphone and camera permissions are granted
4. **WebRTC Connection**: Check ICE candidates and peer connection status
5. **Backend Logs**: Verify the signaling server is processing events correctly

## Known Limitations

- Screen sharing might not work on all browsers
- Safari may have limitations with certain WebRTC features
- Mobile browsers may behave differently than desktop browsers
