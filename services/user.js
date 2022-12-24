const Base = require('./base');

class User extends Base {



    /**
     * 获取单个用户
     * @param {Int} id - user.id
     * @api public
     * @return user
     */
    async getUserList() {


        let sql = 'select * from users limit 100';

        // console.log('this.mysql',)
        let result = await this.mysql.use("tests").query(sql, [])
        console.log('result', result)
        return result.recordset;
    }


    async addUser(user) {

        //using tansactions
        let myTransaction = await await this.mysql.use("tests").transaction();
        try {
            let sql = 'insert into users(username) values(?)';
            let result = await this.mysql.use("tests").query(sql, [user.username], myTransaction);

            let insertId = result.recordset;
            sql = 'insert into user_account(user_id,amount) values(?,?)'
            result = await this.mysql.use("tests").query(sql, [insertId, 0], myTransaction);

            await myTransaction.commit();

            return { id: insertId, username: user.username }
        } catch (err) {
            this.logger.error('add user error', err);
            await myTransaction.rollback();
        }
    }

    async updateUser(user) {

        let sql = 'update users set username = ? where id=?'
        let result = await this.mysql.use('tests').query(sql, [user.username, user.id]);
        if (result.recordset.affectedRows === 1) {
            return true;
        }
        this.logger.error('update user warn', result)
        return false;
    }

}

module.exports = User;
