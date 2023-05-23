const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  test('GET request to /api/stock-prices/', done =>{
    chai.request(server);
    chai.get('/api/stock-prices/');
    chai.query({stock : 'GOOG'});
    chai.end(err, res =>{
      assert.equal(res.status, 200, 'Response status should be 200');
      assert.isObject(res.body, 'Response body should be an object');
      assert.nestedPropertyVal(res.body, "stockData.stock", "GOOG", 'Response body should include {"stock": "GOOG"}');
      assert.property(res.body.stockData, 'price', 'Response body should include "price"');
      assert.property(res.body.stockData, 'likes', 'Response body should include "likes"');
    });
  });
});
