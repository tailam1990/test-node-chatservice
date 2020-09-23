const { filterToSQL } = require('../utils/sql');
const { removeSpaces } = require('../utils/string');

it('Remove spaces', () => {
    expect(removeSpaces('  1  test      1 ')).toBe('1 test 1');
    expect(removeSpaces(' ( test = 1 ) AND   (test2  != 2  ) ')).toBe('(test = 1) AND (test2 != 2)');
    expect(removeSpaces(' [test = 1 ] AND { test2 = 2  }  ')).toBe('[test = 1] AND {test2 = 2}');
});

it('NoSQL -> SQL [$or $and]', () => {
    let query = filterToSQL({
        $or: [{
            $and: [
                { id: 1 },
                { name: 'test1' }
            ]
        }, {
            $and: [
                { name: 'test2' },
                { description: 'desc2' }
            ]
        }]
    });
    expect(removeSpaces(query.sql)).toBe("WHERE ((`id` = ? AND `name` = ?) OR (`name` = ? AND `description` = ?))");
    expect(query.params).toEqual([1, 'test1', 'test2', 'desc2']);
});

it('NoSQL -> SQL [$not]', () => {
    let id = 31;
    let name = 'test31';
    let query = filterToSQL({
        $not: {
            $or: [
                { id: id },
                { name: name }
            ]
        }
    });
    expect(removeSpaces(query.sql)).toBe("WHERE NOT (`id` = ? OR `name` = ?)");
    expect(query.params).toEqual([id, name]);
});

it('NoSQL -> SQL [$ne]', () => {
    let id = 55;
    let query = filterToSQL({
        id: {
            $ne: id
        }
    });
    expect(removeSpaces(query.sql)).toBe("WHERE `id` != ?");
    expect(query.params).toEqual([id]);
});

it('NoSQL -> SQL [$nor]', () => {
    let id = 612;
    let name = 'test612';
    let query = filterToSQL({
        $nor: [
            { id: id },
            { name: name }
        ]
    });
    expect(removeSpaces(query.sql)).toBe("WHERE NOT (`id` = ? OR `name` = ?)");
    expect(query.params).toEqual([id, name]);
});

it('NoSQL -> SQL [$and $nor $not $ne]', () => {
    let id = 123;
    let name = 'test123';
    let desc = 'desc';
    let serial = 'test-serial-1';
    let query = filterToSQL({
        $and: [{
            $nor: [
                { id: id },
                { name: name }
            ]
        }, {
            $not: {
                $and: [
                    { description: { $ne: desc } }, 
                    { serial: serial }
                ]
            }
        }]
    });
    expect(removeSpaces(query.sql)).toBe("WHERE (NOT (`id` = ? OR `name` = ?) AND NOT (`description` != ? AND `serial` = ?))");
    expect(query.params).toEqual([id, name, desc, serial]);
});

it('NoSQL -> SQL [Implicit $and]', () => {
    let now = new Date().getTime();
    let query = filterToSQL({
        from: { $lte: now },
        to: { $gte: now },
        disable: { $ne: 1 }
    });
    expect(removeSpaces(query.sql)).toBe("WHERE `from` <= ? AND `to` >= ? AND `disable` != ?");
    expect(query.params).toEqual([now, now, 1]);
});

it('NoSQL -> SQL [LIKE]', () => {
    let desc = 'test%';
    let query = filterToSQL({
        description: desc
    });
    expect(removeSpaces(query.sql)).toBe("WHERE `description` LIKE ?");
    expect(query.params).toEqual([desc]);
});