( function() {

	'use strict';

	describe( 'UserService', function() {

		var user
			, session
			, httpBackend
			, callback;

		// Data for $httpBackend
		var validUserName = 'fxstr'
			, validPassword = 'mypwd'
			, validResponse = {
				token: 'a1234'
			};

		beforeEach( angular.mock.module( 'jb.user' ) );

		beforeEach( angular.mock.inject( function( UserService, SessionService, $httpBackend ) {

			user = UserService;
			session = SessionService;
			httpBackend = $httpBackend;


			// Spy for promises. httpBackend.flush() can't be used with done().
			callback = {
				success: function() {}
				, error: function() {}
			};

			spyOn( callback, 'success' );
			spyOn( callback, 'error' );

		} ) );


		// PROBLEM: FormData.get is not yet supported. 
		/*function setupHttpBackend() {

			httpBackend.expect( 'POST', '/accessToken' ).respond( function( method, url, data, headers ) {

				// Make sure you use Chrome and enable
				// Enable experimental Web Platform features
				// or get() is not available on FormData
				console.error( '------------' );
				console.error( data.get );
				console.error( data.append );
				console.error( data );
				console.error( data.email );

				if( data && data.get( 'email' ) === validUserName && data.get( 'password' ) === validPassword ) {
					return [ 201, validResponse ];
				}

				return [ 401 ];

			} );

		}*/


		afterEach( function() {

			localStorage.clear();
			httpBackend.verifyNoOutstandingExpectation();
			httpBackend.verifyNoOutstandingRequest();

		} );


		it( 'Has a login, logout and isAuthenticated method.', function() {

			expect( typeof( user.login ) ).toBe( 'function' );
			expect( typeof( user.logout ) ).toBe( 'function' );
			expect( typeof( user.isAuthenticated ) ).toBe( 'function' );

		} );

		describe( 'When logging in with valid user data', function() {

			it( 'makes the correct HTTP call', function() {

				var expectedData = new FormData();
				expectedData.append( 'email', validUserName );
				expectedData.append( 'password', validPassword );

				httpBackend.expectPOST( '/accessToken', expectedData ).respond( 201, validResponse );
				user.login( validUserName, validPassword );
				httpBackend.flush();

			} );


			it( 'stores the authToken in the session', function() {

				httpBackend.expectPOST( '/accessToken' ).respond( 201, validResponse );

				user.login( validUserName, validPassword ).then( callback.success, callback.error );
				
				httpBackend.flush();

				expect( session.get( 'accessToken' ) ).toEqual( 'a1234' );
				expect( callback.success ).toHaveBeenCalled();
				expect( callback.error ).not.toHaveBeenCalled();

			} );
			
		} );


		describe( 'When logging in with invalid user data', function() {

			it( 'rejects the promise if user data is invalid', function() {

				httpBackend.expectPOST( '/accessToken' ).respond( 401 );

				user.login( validUserName, 'blah' ).then( callback.success, callback.error );
				
				httpBackend.flush();

				expect( session.get( 'accessToken' ) ).toBe( undefined );
				expect( callback.success ).not.toHaveBeenCalled();
				expect( callback.error ).toHaveBeenCalled();

			} );


		} );



		describe( 'When logging out', function() {

			it( 'deletes the accessToken from the server and from localStorage', function() {

				httpBackend.expectPOST( '/accessToken' ).respond( 201, validResponse );
				httpBackend.expectDELETE( '/accessToken/' + validResponse.token ).respond( 200 );

				user.login( validUserName, validPassword )
					.then( function() {
						user.logout();
					} );

				httpBackend.flush();

				expect( session.get( 'accessToken' ) ).toBe( undefined );

			} );

		} );


		describe( 'When calling isAuthenticated', function() {

			it( 'returns the expected value', function() {

				httpBackend.expectPOST( '/accessToken' ).respond( 201, validResponse );
				httpBackend.expectDELETE( '/accessToken/' + validResponse.token ).respond( 200 );

				user.login( validUserName, validPassword )
					.then( function() {
						expect( user.isAuthenticated() ).toBe( true );
						return user.logout();
					} )
					.then( function() {
						expect( user.isAuthenticated() ).toBe( false );
					} );

				httpBackend.flush();

			} );

		} );


	} );

} )();