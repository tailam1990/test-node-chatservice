// create table test_class (
// 	   `id` int primary key AUTO_INCREMENT,
//     `serial` varchar(100) not null,
//     `name` varchar(50) not null,
//     `description` varchar(100)
// );

// INSERT INTO test_class (`serial`, `name`, `description`)
// VALUES ('test-serial-1', 'test-name', 'test-description');

// Workaround for mysql2 - Jest error
require('iconv-lite').encodings = require('iconv-lite/encodings');
require('dotenv').config();
const db = require('../db/db');
const { initModels, initDBConnection } = require('../utils/init');
const TestClass = require('../models/table/test-class');
const uuid = require('uuid/v1');

beforeAll(async () => {
    try {
        await initDBConnection();
        await initModels();
    } catch (ex) {
        console.error(ex);
    }
    return;
});

it('Init', () => {
    expect(Promise.resolve().finally).toBeDefined();
    expect(TestClass).toBeDefined();
});

it('DB select', async () => {
    let dataList = await db.select(TestClass, { id: 1 });
    expect(dataList.length).toBe(1);
    expect(dataList[0].serial).toBe('test-serial-1');
});

it('DB update', async () => {
    // Select fixed record
    let testBefore = await db.selectFirst(TestClass, { id: 1 });
    testBefore.description = new Date().getTime().toString();
    // Update that record
    let rowAffected = await db.update(testBefore);
    let testAfter = await db.selectFirst(TestClass, { id: 1 });
    // Expect 1 row updated and description match
    expect(rowAffected).toBe(1);
    expect(testAfter).toEqual(testBefore);
});

it('DB transaction', async () => {
    let serials = [uuid(), uuid()];
    let names = ['success ' + serials[0], 'fail' + serials[1]];

    await db.executeTrx(async conn => {
        await db.insert(new TestClass({ name: names[0], serial: serials[0] }), conn);
        await db.insert(new TestClass({ name: names[0], serial: serials[1] }), conn);
    });

    await db.executeTrx(async conn => {
        await db.insert(new TestClass({ name: names[1], serial: serials[0] }), conn);
        await db.insert(new TestClass({ name: names[1], serial: serials[1] }), conn);
        await db.insert(new TestClass({ name: names[1], serial: null }), conn);
    }).catch(e => {
        expect(['ER_BAD_NULL_ERROR', 'ER_NO_DEFAULT_FOR_FIELD']).toContain(e.code);
    });

    let resultSuccess = await db.select(TestClass, { name: names[0] });
    let resultFail = await db.select(TestClass, { name: names[1] });

    expect(resultSuccess.length).toBe(2);
    expect(resultSuccess[0].name).toBe(names[0]);
    expect(resultSuccess[0].serial).toBe(serials[0]);
    expect(resultSuccess[1].name).toBe(names[0]);
    expect(resultSuccess[1].serial).toBe(serials[1]);
    expect(resultFail).toEqual([]);
});

it('DB delete', async () => {
    await db.delete(TestClass, { id: { $ne: 1 } });
    let dataList = await db.select(TestClass);
    expect(dataList.length).toBe(1);
    expect(dataList[0].id).toBe(1);
    expect(dataList[0].serial).toBe('test-serial-1');
});

afterAll(() => {
    return db.close();
});