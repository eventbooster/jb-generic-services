/**
* User service for angular and fluffy/distributed: 
* Authenticates the user (login) and stores login information in Session (see jb-session)
* 
* Requires jb-session
*/

( function() {

	'use strict';

	angular
	.module( 'jb.user', [ 'eb.apiWrapper', 'jb.session' ] )
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
				return $q.reject( new Error( 'Could not login: ' + err.message ) );
			} );


		};


		/**
		* Logout user: 
		* - remove all data from user's scope in the session
		* - delete accessToken from server
		*/
		User.prototype.logout = function() {

		};


		/**
		* Returns true if user is authenticated (i.e. has an accessToken in the localStorage )
		* – is not validated against the server.
		*/
		User.prototype.isAuthenticated = function() {

		};


		return new User();

	} ] );


} )();

