( function() {

	'use strict';

	describe( 'SessionService', function() {

		var service;

		beforeEach( angular.mock.module( 'jb.session' ) );

		beforeEach( angular.mock.inject( function( SessionService ) {
			service = SessionService;
		} ) );

		afterEach( function() {
			localStorage.clear();
		} );


		it( 'Has a set and a get method.', function() {

			expect( typeof( service.get ) ).toBe( 'function' );
			expect( typeof( service.set ) ).toBe( 'function' );

		} );


		describe( 'When a value is stored', function() {

			it( 'returns that same value on the same scope', function() {

				service.set( 'userTest', 1, 'user' );
				expect( service.get( 'userTest', 'user' ) ).toEqual( 1 );

				service.set( 'sessionTest', 2, 'local' );
				expect( service.get( 'sessionTest', 'local' ) ).toEqual( 2 );

			} );

			it( 'returns undefined if value was not set', function() {

				expect( service.get( 'inexistentKey' ) ).toBe( undefined );

			} );


			it( 'serializes and de-serializes objects and arrays', function() {

				var store = { key1: 'val1', key2: [ 'val2.1', 'val2.2' ], key3: null };
				service.set( 'userTest', store, 'user' );
				expect( service.get( 'userTest', 'user' ) ).toEqual( store );

			} );


			it( 'doesn\'t accept bad scopes', function() {

				var errorMessage = 'Session: The scope \'none\' is not valid. Please use scopes \'user\' or \'local\'.';
				// http://stackoverflow.com/questions/4144686/jasmine-how-to-write-a-test-which-expects-an-error-to-be-thrown
				expect( service.set.bind( this, 'userTest', 'test', 'none' ) ).toThrowError( errorMessage );

			} );


			it( 'uses user scope by default to store values', function() {

				service.set( 'testKey', 'testValue' );
				expect( service.get( 'testKey', 'user' ) ).toEqual( 'testValue' );
				expect( service.get( 'testKey', 'local' ) ).toBe( undefined );

			} );



			it( 'returns the user scoped value, if scope is not defined on get and with second prioirty local the scope', function() {

				service.set( 'testKey', 'userValue', 'user' );
				service.set( 'testKey', 'localValue', 'local' );
				expect( service.get( 'testKey' ) ).toEqual( 'userValue' );

				service.remove( 'testKey', 'user' );
				expect( service.get( 'testKey' ) ).toEqual( 'localValue' );
				
			} );


			it( 'acceps valid expiration dates', function() {

				var expirationDate = new Date( new Date().getTime() + 100 );
				var stringDate = expirationDate.getFullYear() + '-' + (expirationDate.getMonth() + 1 ) + '-' + expirationDate.getDate();

				expect( service.set.bind( this, 'testKey', 'userValue', 'user', expirationDate ) ).not.toThrow();
				expect( service.set.bind( this, 'testKey', 'userValue', 'user', expirationDate.getTime() ) ).not.toThrow();
				expect( service.set.bind( this, 'testKey', 'userValue', 'user', stringDate ) ).not.toThrow();

				expect( service.set.bind( this, 'testKey', 'userValue', 'user', 'invaliddate' ) ).toThrow();				

			} );

			it( 'removes values after expiration data is reached', function( done ) {

				service.set( 'testKey', 'userValue', 'user', new Date().getTime() + 1000 );
				expect( service.get( 'testKey' ) ).toEqual( 'userValue' );

				setTimeout( function() {
					expect( service.get( 'testKey' ) ).toEqual( undefined );
					done();
				}, 1500 );


			} );


		} );

		describe( 'When a value is removed', function() {

			it( 'removes the correctly scoped key', function() {

				service.set( 'testKey', 'userValue', 'user' );
				service.set( 'testKey', 'localValue', 'local' );

				service.remove( 'testKey', 'user' );
				expect( service.get( 'testKey', 'user' ) ).toBe( undefined );
				expect( service.get( 'testKey', 'local' ) ).toEqual( 'localValue' );

				service.remove( 'testKey', 'local' );
				expect( service.get( 'testKey', 'local' ) ).toBe( undefined );

			} );

			it( 'removes both scopes, if no scope is passed', function() {

				service.set( 'testKey', 'userValue', 'user' );
				service.set( 'testKey', 'localValue', 'local' );

				service.remove( 'testKey' );
				expect( service.get( 'testKey', 'user' ) ).toBe( undefined );
				expect( service.get( 'testKey', 'local' ) ).toBe( undefined );

			} );

		} );


		describe( 'When calling logout', function() {

			it( 'only removes the user scoped data', function() {

				service.set( 'testKey', 'userValue', 'user' );
				service.set( 'testKey', 'localValue', 'local' );

				service.logout();
				expect( service.get( 'testKey', 'user' ) ).toBe( undefined );
				expect( service.get( 'testKey', 'local' ) ).toEqual( 'localValue' );

			} );

		} );


		describe( 'When calling destroy', function() {

			it( 'only removes all data', function() {

				service.set( 'testKey', 'userValue', 'user' );
				service.set( 'testKey', 'localValue', 'local' );

				service.destroy();
				expect( service.get( 'testKey', 'user' ) ).toBe( undefined );
				expect( service.get( 'testKey', 'local' ) ).toBe( undefined );

			} );

		} );



	} );

} )();