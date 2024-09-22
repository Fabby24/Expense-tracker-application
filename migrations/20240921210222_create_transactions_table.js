/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('transactions', (table) => {
        table.increments('id').primary();
        table.string('name', 50).notNullable();
        table.decimal('amount', 10, 2);
        table.date('date');
        table.enu('type', ['income', 'expense']);
        table.integer('user_id').unsigned().notNullable();
        table.foreign('user_id').references('users.id');  // Foreign key
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('transactions');
};
