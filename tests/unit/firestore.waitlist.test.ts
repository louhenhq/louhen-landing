import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { WaitlistUpsertInput } from '@/lib/firestore/waitlist';

type TestStore = Map<string, unknown>;
const testGlobal = globalThis as typeof globalThis & { __WAITLIST_TEST_STORE__?: TestStore };
const originalTestMode = process.env.TEST_MODE;

beforeAll(() => {
  process.env.TEST_MODE = '1';
});

afterAll(() => {
  if (originalTestMode === undefined) {
    delete process.env.TEST_MODE;
  } else {
    process.env.TEST_MODE = originalTestMode;
  }
});

beforeEach(() => {
  testGlobal.__WAITLIST_TEST_STORE__ = new Map();
});

afterEach(() => {
  delete testGlobal.__WAITLIST_TEST_STORE__;
});

import {
  findByEmail,
  getPreOnboardingDraft,
  hasPreOnboarded,
  markConfirmedByTokenHash,
  markExpiredByTokenHash,
  savePreOnboardingDraft,
  upsertPending,
} from '@/lib/firestore/waitlist';

function buildInput(overrides: Partial<WaitlistUpsertInput> = {}): WaitlistUpsertInput {
  return {
    locale: 'en',
    utm: { source: 'ads' },
    ref: 'invite',
    consent: true,
    confirmExpiresAt: new Date(Date.now() + 86400000),
    confirmTokenHash: 'hash-123',
    confirmTokenLookupHash: 'lookup-123',
    confirmSalt: 'salt-123',
    ...overrides,
  };
}

describe.sequential('waitlist Firestore helpers', () => {
  it('creates a pending record for new emails', async () => {
    const result = await upsertPending('Test@Example.com', buildInput());
    expect(result.created).toBe(true);
    expect(result.status).toBe('pending');

    const record = await findByEmail('test@example.com');
    expect(record).not.toBeNull();
    expect(record?.status).toBe('pending');
    expect(record?.confirmTokenHash).toBe('hash-123');
  });

  it('updates existing pending record with new token', async () => {
    await upsertPending('user@example.com', buildInput());
    await upsertPending('user@example.com', buildInput({ confirmTokenHash: 'hash-456', confirmTokenLookupHash: 'lookup-456' }));

    const record = await findByEmail('user@example.com');
    expect(record?.confirmTokenHash).toBe('hash-456');
    expect(record?.confirmTokenLookupHash).toBe('lookup-456');
  });

  it('does not overwrite confirmed records', async () => {
    const email = 'confirmed@example.com';
    const initialInput = buildInput();

    await upsertPending(email, initialInput);

    const pending = await findByEmail(email);
    expect(pending).not.toBeNull();
    const pendingRecord = pending!;
    expect(pendingRecord.status).toBe('pending');
    expect(pendingRecord.confirmTokenHash).toBe(initialInput.confirmTokenHash);
    expect(pendingRecord.confirmTokenLookupHash).toBe(initialInput.confirmTokenLookupHash);

    const lookupHash = pendingRecord.confirmTokenLookupHash;
    expect(lookupHash).toBeTruthy();
    if (!lookupHash) {
      throw new Error('lookup hash should be present before confirmation step');
    }

    const confirmResult = await markConfirmedByTokenHash(lookupHash);
    expect(confirmResult).toBe('confirmed');

    const confirmed = await findByEmail(email);
    console.log('[TEST][pre-upsert]', confirmed);
    expect(confirmed).not.toBeNull();
    const confirmedRecord = confirmed!;
    expect(confirmedRecord.status).toBe('confirmed');
    expect(confirmedRecord.confirmTokenHash).toBeNull();
    expect(confirmedRecord.confirmTokenLookupHash).toBeNull();

    const nextInput: WaitlistUpsertInput = {
      ...initialInput,
      confirmTokenHash: 'new-hash',
      confirmTokenLookupHash: 'new-lookup',
      confirmExpiresAt: new Date(Date.now() + 86400000),
    };

    await upsertPending(email, nextInput);
    const record = await findByEmail(email);
    console.log('[TEST][post-upsert]', record);
    expect(record).not.toBeNull();
    const finalRecord = record!;
    expect(finalRecord.status).toBe('confirmed');
    expect(finalRecord.confirmTokenHash).toBeNull();
    expect(finalRecord.confirmTokenLookupHash).toBeNull();
  });

  it('marks record confirmed by lookup hash', async () => {
    await upsertPending('confirm@example.com', buildInput({ confirmTokenLookupHash: 'lookup-999' }));
    const result = await markConfirmedByTokenHash('lookup-999');
    expect(result).toBe('confirmed');

    const record = await findByEmail('confirm@example.com');
    expect(record?.status).toBe('confirmed');
    expect(record?.confirmedAt).toBeInstanceOf(Date);
  });

  it('marks record expired by lookup hash', async () => {
    await upsertPending('expire@example.com', buildInput({ confirmTokenLookupHash: 'lookup-321' }));
    const result = await markExpiredByTokenHash('lookup-321');
    expect(result).toBe('expired');

    const record = await findByEmail('expire@example.com');
    expect(record?.status).toBe('expired');
    expect(record?.confirmTokenLookupHash).toBeNull();
  });

  it('saves pre-onboarding draft and marks record', async () => {
    const { docId } = await upsertPending('family@example.com', buildInput());

    await savePreOnboardingDraft(docId, {
      parentFirstName: 'Jamie',
      children: [
        {
          name: 'Noah',
          birthday: '2018-05-10',
          weight: 22,
          shoeSize: '32 EU',
        },
      ],
    });

    const record = await findByEmail('family@example.com');
    expect(record?.preOnboarded).toBe(true);
    expect(record?.profileDraft?.children[0]?.name).toBe('Noah');

    const hasDraft = await hasPreOnboarded(docId);
    expect(hasDraft).toBe(true);

    const draft = await getPreOnboardingDraft(docId);
    expect(draft?.parentFirstName).toBe('Jamie');
    expect(draft?.children[0]?.weight).toBe(22);
  });

  it('overwrites existing pre-onboarding draft on subsequent saves', async () => {
    const { docId } = await upsertPending('update@example.com', buildInput());

    await savePreOnboardingDraft(docId, {
      parentFirstName: 'Alex',
      children: [
        { name: 'Mila', birthday: '2019-03-02' },
      ],
    });

    await savePreOnboardingDraft(docId, {
      parentFirstName: 'Taylor',
      children: [
        { name: 'Leo', birthday: '2017-07-21', weight: 28 },
      ],
    });

    const draft = await getPreOnboardingDraft(docId);
    expect(draft?.parentFirstName).toBe('Taylor');
    expect(draft?.children).toHaveLength(1);
    expect(draft?.children[0]?.name).toBe('Leo');
    expect(draft?.children[0]?.weight).toBe(28);
  });
});
