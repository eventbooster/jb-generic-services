/**
* User service for angular and fluffy/distributed: 
* Authenticates the user (login) and stores login information in Session (see jb-session)
* 
* Requires jb-session
*/

( function() {

	'use strict';

	angular
	.module( 'jb.user', [ 'jb.apiWrapper', 'jb.session' ] )
	.factory( 'UserService', [ '$q', 'SessionService', 'APIWrapperService', function( $q, SessionService, APIWrapperService ) {


		/////////////////////////////////////
		//
		// Valid scope variables.
		//

		var User = function() {
		};


		/**
		* Checks if the user is authenticated; if he is, 
		* - returns true
		* - stores the user's accessToken in the session
		* else 
		* - returns an error
		*
		* @param <String> userName
		* @param <String> password
		*
		* @return <Error|true>
		*/
		User.prototype.login = function( userName, password ) {

			return APIWrapperService.request( {
				method			: 'POST'
				, url			: '/accessToken'
				, data			: {
					email		: userName
					, password	: password
				}
			} )
			.then( function( data ) {

				// Remove old user data
				SessionService.logout();

				SessionService.set( 'accessToken', data.token );
				return true;

			}, function( err ) {
				return $q.reject( new Error( 'UserService: Could not login: ' + err.message ) );
			} );


		};


		/**
		* Logout user: 
		* - remove all data from user's scope in the session
		* - delete accessToken from server
		*
		* Returns a promise.
		*/
		User.prototype.logout = function() {

			console.log( 'UserService: Logout user' );

			var accessToken = SessionService.get( 'accessToken' );

			if( accessToken ) {
				return APIWrapperService.request( {
					method				: 'DELETE'
					, url				: '/accessToken/' + accessToken
				} )

				// accessToken must be removed from Session _after_ it was deleted from server. If it's not in the Session
				// any more while we make the DELETE request, the user is not authenticated and may therefore not remove 
				// his or her own accessToken.
				.then( function() {
					console.log( 'UserService: Removed accessToken from server' );
					SessionService.logout();
					return true;
				}, function( err ) {
					console.error( 'UserService: Could not remove accessToken from server: ' + JSON.stringify( err ) );
					SessionService.logout();
					return $q.reject( err );
				} );
			}
			else {

				SessionService.logout();

				var deferred = $q.defer();
				deferred.resolve();
				return deferred.promise;

			}


		};


		/**
		* Returns true if user is authenticated (i.e. has an accessToken in the localStorage )
		* – is not validated against the server.
		*/
		User.prototype.isAuthenticated = function() {

			if( SessionService.get( 'accessToken' ) ) {
				return true;
			}
			return false;

		};


		return new User();

	} ] );


} )();

