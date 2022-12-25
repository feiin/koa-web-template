TESTS = $(shell find  tests/api -type f -name "*.test.js")
TEST_TIMEOUT = 10000
MOCHA_REPORTER = spec

test:
	@NODE_ENV=test mocha \
     	--reporter $(MOCHA_REPORTER) \
        -r should \
     	--timeout $(TEST_TIMEOUT) \
     	$(TESTS)
install:
	cp ./logrotate/koa-web-template /etc/logrotate.d/
apidoc:
	apidoc -i controllers/ -o public/apidoc
.PHONY: test