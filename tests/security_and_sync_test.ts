import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3000';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSecurityAndSyncTests() {
  console.log('====================================================');
  console.log('Starting GreenRoom Security & Synchronization Test Suite');
  console.log('====================================================\n');

  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, testName: string, detail: string = '') {
    if (condition) {
      console.log(`[PASS] ${testName} ${detail ? `(${detail})` : ''}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
      failCount++;
    }
  }

  // ----------------------------------------------------
  // TEST 1: Unauthenticated Socket Rejection
  // ----------------------------------------------------
  try {
    const unauthSocket = io(SERVER_URL, {
      autoConnect: true,
      reconnection: false,
      timeout: 3000
    });

    const connectErrorPromise = new Promise<string>((resolve) => {
      unauthSocket.on('connect_error', (err) => resolve(err.message));
      unauthSocket.on('connect', () => resolve('CONNECTED_UNEXPECTEDLY'));
    });

    const result = await connectErrorPromise;
    assert(
      result.includes('Unauthorized') || result.includes('Authentication required'),
      'Test 1: Unauthenticated Socket Rejection',
      result
    );
    unauthSocket.disconnect();
  } catch (err: any) {
    assert(false, 'Test 1: Unauthenticated Socket Rejection', err.message);
  }

  // ----------------------------------------------------
  // TEST 2: Authenticated Socket Connection & Handshake
  // ----------------------------------------------------
  const hostUserId = `host-${Date.now()}`;
  const hostUserName = 'Security Host';
  const hostSocket = io(SERVER_URL, {
    auth: {
      userId: hostUserId,
      userName: hostUserName,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Host'
    },
    reconnection: false
  });

  await new Promise<void>((resolve, reject) => {
    hostSocket.on('connect', () => resolve());
    hostSocket.on('connect_error', (err) => reject(err));
  });
  assert(hostSocket.connected, 'Test 2: Authenticated Socket Handshake Successful');

  // ----------------------------------------------------
  // TEST 3: Create Host-Only Watch Room
  // ----------------------------------------------------
  let roomId = '';
  try {
    const createRes = await fetch(`${SERVER_URL}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Confidential Security Screening',
        hostName: hostUserName,
        playbackControl: 'host-only'
      })
    });
    const createData = await createRes.json();
    roomId = createData.room.id;
    assert(Boolean(roomId && roomId.length === 6), 'Test 3: Room Creation with 6-char Code', `Code: ${roomId}`);
  } catch (err: any) {
    assert(false, 'Test 3: Room Creation', err.message);
  }

  // Host joins room
  hostSocket.emit('join-room', { roomId });
  await sleep(300);

  // ----------------------------------------------------
  // TEST 4: Legitimate Host Can Execute Playback Command
  // ----------------------------------------------------
  let hostPlaybackSynced = false;
  hostSocket.on('playback-sync', (payload) => {
    if (payload.action === 'play') {
      hostPlaybackSynced = true;
    }
  });

  hostSocket.emit('playback-command', {
    roomId,
    action: 'play',
    position: 45
  });
  await sleep(400);
  assert(hostPlaybackSynced, 'Test 4: Legitimate Host Playback Control Executed');

  // ----------------------------------------------------
  // TEST 5: Identity Spoofing Defense (CRITICAL VULNERABILITY FIX)
  // ----------------------------------------------------
  // Connect attacker guest socket
  const attackerUserId = `attacker-${Date.now()}`;
  const attackerSocket = io(SERVER_URL, {
    auth: {
      userId: attackerUserId,
      userName: 'Malicious Guest'
    },
    reconnection: false
  });

  await new Promise<void>(resolve => attackerSocket.on('connect', () => resolve()));
  attackerSocket.emit('join-room', { roomId });
  await sleep(300);

  let spoofRejected = false;
  attackerSocket.on('error-message', (msg) => {
    if (msg.includes('Unauthorized') || msg.includes('host can control')) {
      spoofRejected = true;
    }
  });

  // Attacker attempts to pause by passing the host's userId in the payload!
  attackerSocket.emit('playback-command', {
    roomId,
    action: 'pause',
    position: 10,
    userId: hostUserId // Attempted spoof!
  });
  await sleep(400);

  assert(spoofRejected, 'Test 5: Client-Supplied Identity Spoofing Denied by Server');

  // ----------------------------------------------------
  // TEST 6: Message Size Limits (1,000 char ceiling)
  // ----------------------------------------------------
  let oversizedRejected = false;
  attackerSocket.on('error-message', (msg) => {
    if (msg.includes('1,000 character limit')) {
      oversizedRejected = true;
    }
  });

  const hugeMessage = 'A'.repeat(1200);
  attackerSocket.emit('chat-message', {
    roomId,
    message: { text: hugeMessage }
  });
  await sleep(400);
  assert(oversizedRejected, 'Test 6: Chat Message Exceeding 1,000 Characters Rejected');

  // ----------------------------------------------------
  // TEST 7: Socket Inbound Rate Limiting
  // ----------------------------------------------------
  let rateLimitHit = false;
  attackerSocket.on('rate-limit-error', (err) => {
    if (err.type === 'chat') {
      rateLimitHit = true;
    }
  });

  // Fire 8 messages in quick succession
  for (let i = 0; i < 8; i++) {
    attackerSocket.emit('chat-message', {
      roomId,
      message: { text: `Burst message ${i}` }
    });
  }
  await sleep(500);
  assert(rateLimitHit, 'Test 7: Rapid Chat Flood Triggers Inbound Rate Limiter');

  // ----------------------------------------------------
  // TEST 8: Host Transfer & Privilege Revocation
  // ----------------------------------------------------
  let transferConfirmed = false;
  hostSocket.on('room-settings-updated', (settings) => {
    if (settings.hostId === attackerUserId) {
      transferConfirmed = true;
    }
  });

  hostSocket.emit('host-action', {
    roomId,
    action: 'transfer',
    targetUserId: attackerUserId
  });
  await sleep(400);

  // Now former host tries to execute host-only command
  let formerHostDenied = false;
  hostSocket.on('error-message', (msg) => {
    if (msg.includes('Unauthorized') || msg.includes('host can control')) {
      formerHostDenied = true;
    }
  });

  hostSocket.emit('playback-command', {
    roomId,
    action: 'pause',
    position: 50
  });
  await sleep(400);

  assert(
    transferConfirmed && formerHostDenied,
    'Test 8: Host Transfer Revokes Former Host Privileges Safely'
  );

  // ----------------------------------------------------
  // TEST 9: Persistent Storage Verification
  // ----------------------------------------------------
  try {
    const fs = await import('fs');
    const path = await import('path');
    const dataFile = path.resolve(process.cwd(), 'data/rooms.json');
    const exists = fs.existsSync(dataFile);
    if (exists) {
      const content = fs.readFileSync(dataFile, 'utf-8');
      const hasRoom = content.includes(roomId);
      assert(hasRoom, 'Test 9: Durable Room Persistence Written to Disk', `File: ${dataFile}`);
    } else {
      assert(false, 'Test 9: Durable Room Persistence', 'File data/rooms.json does not exist');
    }
  } catch (err: any) {
    assert(false, 'Test 9: Durable Room Persistence', err.message);
  }

  // Cleanup
  hostSocket.disconnect();
  attackerSocket.disconnect();

  console.log('\n====================================================');
  console.log(`Test Execution Finished: ${passCount} Passed, ${failCount} Failed.`);
  console.log('====================================================');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSecurityAndSyncTests();
