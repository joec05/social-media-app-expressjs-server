var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// userRoutes.ts
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import pkg from 'pg';
const { Client } = pkg;
const username = 'joec05';
const IP = '192.168.1.153';
const PORT = 5433;
const password = 'josccarl123';
const profilesDbConfig = {
    host: '192.168.1.153',
    user: 'joec05',
    password: 'josccarl123',
    database: 'users_profiles',
    port: 5433
};
const postsDbConfig = {
    host: '192.168.1.153',
    user: 'joec05',
    password: 'josccarl123',
    database: 'users_posts',
    port: 5433
};
const activitiesLogsDbConfig = {
    host: '192.168.1.153',
    user: 'joec05',
    password: 'josccarl123',
    database: 'users_activities_logs',
    port: 5433
};
const keywordsDbConfig = {
    host: '192.168.1.153',
    user: 'joec05',
    password: 'josccarl123',
    database: 'keywords',
    port: 5433
};
const chatsDbConfig = {
    host: '192.168.1.153',
    user: 'joec05',
    password: 'josccarl123',
    database: 'users_chats',
    port: 5433
};
const profilesClient = new Client(profilesDbConfig);
profilesClient.connect().catch(err => console.log(err));
const postsClient = new Client(postsDbConfig);
postsClient.connect().catch(err => console.log(err));
const activitiesLogsClient = new Client(activitiesLogsDbConfig);
activitiesLogsClient.connect().catch(err => console.log(err));
const keywordsClient = new Client(keywordsDbConfig);
keywordsClient.connect().catch(err => console.log(err));
const chatsClient = new Client(chatsDbConfig);
chatsClient.connect().catch(err => console.log(err));
const usersRoutes = express.Router();
const secretKey = 'e52bc407-7c31-464f-bce4-8057ce1383ae';
// Login route
usersRoutes.post('/loginWithEmail', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    console.log(req.body);
    try {
        const checkEmailQuery = 'SELECT * FROM basic_data.user_profile WHERE email = $1 AND suspended = $2 AND deleted = $3';
        const existingUser = yield profilesClient.query(checkEmailQuery, [email, false, false]);
        if (existingUser.rows.length === 0) {
            return res.json({ message: 'Email not found' });
        }
        else {
            const user = existingUser.rows[0];
            const userId = user.user_id;
            const checkPasswordQuery = 'SELECT password FROM sensitive_data.user_password WHERE user_id = $1';
            const hashedPassword = yield profilesClient.query(checkPasswordQuery, [userId]);
            if (hashedPassword.rows.length === 0) {
                return res.json({ message: 'Internal Server Error' });
            }
            else {
                const storedPassword = hashedPassword.rows[0].password;
                const passwordMatch = yield bcrypt.compare(password, storedPassword);
                if (!passwordMatch) {
                    return res.json({ message: 'Incorrect password' });
                }
                else {
                    const token = jwt.sign({ userId }, secretKey, { expiresIn: '1h' });
                    res.json({ message: 'Login successful', token, userID: userId, userProfileData: user });
                }
            }
        }
    }
    catch (error) {
        console.error('Error during login:', error);
        res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.post('/loginWithUsername', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    console.log(req.body);
    try {
        console.log('1');
        const checkUsernameQuery = 'SELECT * FROM basic_data.user_profile WHERE username = $1 AND suspended = $2 AND deleted = $3';
        const existingUser = yield profilesClient.query(checkUsernameQuery, [username, false, false]);
        console.log('2');
        if (existingUser.rows.length === 0) {
            console.log('2a');
            return res.json({ message: 'Username not found' });
        }
        else {
            console.log('2b');
            const user = existingUser.rows[0];
            const userId = user.user_id;
            const checkPasswordQuery = 'SELECT password FROM sensitive_data.user_password WHERE user_id = $1';
            const hashedPassword = yield profilesClient.query(checkPasswordQuery, [userId]);
            console.log('3');
            if (hashedPassword.rows.length === 0) {
                console.log('3a');
                return res.json({ message: 'Internal Server Error' });
            }
            else {
                console.log('3b');
                const storedPassword = hashedPassword.rows[0].password;
                const passwordMatch = yield bcrypt.compare(password, storedPassword);
                if (!passwordMatch) {
                    return res.json({ message: 'Incorrect password' });
                }
                else {
                    const token = jwt.sign({ userId }, secretKey, { expiresIn: '1h' });
                    res.json({ message: 'Login successful', token, userID: userId, userProfileData: user });
                }
            }
        }
    }
    catch (error) {
        console.error('Error during login:', error);
        res.json({ message: 'Internal Server Error' });
    }
}));
// Signup route
usersRoutes.post('/signUp', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, username, profilePicLink, email, password, birthDate } = req.body;
    console.log(req.body);
    try {
        const userId = uuidv4();
        const hashed = yield bcrypt.hash(password, 10);
        // Insert user data
        const insertUserProfileQuery = `
      INSERT INTO basic_data.user_profile (
        user_id, name, username, email, profile_picture_link, date_joined, birth_date, bio, private, verified, suspended, deleted
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `;
        const insertUserPasswordQuery = `
      INSERT INTO sensitive_data.user_password (user_id, password)
      VALUES ($1, $2)
    `;
        try {
            yield profilesClient.query('BEGIN');
            yield profilesClient.query(insertUserProfileQuery, [
                userId,
                name,
                username,
                email,
                profilePicLink,
                new Date().toISOString(),
                birthDate,
                '',
                false,
                false,
                false,
                false
            ]);
            yield profilesClient.query(insertUserPasswordQuery, [userId, hashed]);
            yield profilesClient.query('COMMIT');
            const token = jwt.sign({ userId }, secretKey, { expiresIn: '1h' });
            console.log(token);
            // Send a success response to the profilesClient
            res.json({ message: 'Successfully signed up', token: token, userID: userId });
            console.log('User data inserted successfully');
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield profilesClient.query('ROLLBACK');
            yield postsClient.query('ROLLBACK');
            console.error('Error inserting user data:', error);
            // Send an error response to the profilesClient
            res.json({ message: error.detail });
        }
    }
    catch (error) {
        console.error('Internal error inserting user data:', error);
        yield profilesClient.query('ROLLBACK');
        yield postsClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/checkAccountExistsSignUp', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, username } = req.body;
    console.log(req.body);
    try {
        const checkAccountExistsQuery = `
      SELECT * FROM basic_data.user_profile WHERE (email = $1 OR username = $2) AND suspended = $3 AND deleted = $4
    `;
        try {
            const checkAccountExists = yield profilesClient.query(checkAccountExistsQuery, [
                email, username, false, false
            ]);
            const accountExists = checkAccountExists.rowCount > 0;
            res.json({ 'message': 'Successfully checked account existence', 'exists': accountExists });
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield profilesClient.query('ROLLBACK');
            console.error('Error inserting user data:', error);
            // Send an error response to the profilesClient
            res.json({ message: error.detail });
        }
    }
    catch (error) {
        console.error('Internal error inserting user data:', error);
        yield profilesClient.query('ROLLBACK');
        yield postsClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/checkAccountExists', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userID } = req.body;
    console.log(req.body);
    try {
        const checkAccountExistsQuery = `
      SELECT * FROM basic_data.user_profile WHERE user_id = $1 AND suspended = $2 AND deleted = $3
    `;
        try {
            const checkAccountExists = yield profilesClient.query(checkAccountExistsQuery, [
                userID, false, false
            ]);
            const accountExists = checkAccountExists.rowCount > 0;
            res.json({ 'message': 'Successfully checked account existence', 'exists': accountExists });
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield profilesClient.query('ROLLBACK');
            console.error('Error inserting user data:', error);
            // Send an error response to the profilesClient
            res.json({ message: error.detail });
        }
    }
    catch (error) {
        console.error('Internal error inserting user data:', error);
        yield profilesClient.query('ROLLBACK');
        yield postsClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.post('/completeSignUpProfile', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, profilePicLink, bio } = req.body;
    console.log(req.body);
    try {
        const insertUserProfileQuery = `
      UPDATE basic_data.user_profile
      SET profile_picture_link = $2, bio = $3
      WHERE user_id = $1
    `;
        try {
            yield profilesClient.query('BEGIN');
            yield profilesClient.query(insertUserProfileQuery, [
                userId,
                profilePicLink,
                bio,
            ]);
            yield profilesClient.query('COMMIT');
            res.json({ message: 'Successfully updated your account' });
            console.log('User data inserted successfully');
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield profilesClient.query('ROLLBACK');
            console.error('Error inserting user data:', error);
            // Send an error response to the profilesClient
            res.json({ message: 'Server error' });
        }
    }
    catch (error) {
        console.error('Error inserting user data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.post('/uploadPost', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postId, content, sender, mediasDatas, hashtags, taggedUsers } = req.body;
    console.log(req.body);
    try {
        const insertPostDataQuery = `
      INSERT INTO posts_list.posts_data (
        post_id, type, content, sender, upload_time, medias_datas, deleted
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
        //var uuidArr = new Array(1500000).fill(0).map(() => uuidv4());
        //var contentsArr = new Array(1500000).fill(0).map((e, i) => `fanatic ${Math.random() * 100000} gate ${i}`);
        const insertPostDataQuery2 = `
      INSERT INTO posts_list.posts_data (
        post_id, type, content, sender, upload_time, medias_datas, deleted
      )
      SELECT
      postid as post_id,
      $1 as type,
      content as content,
      $2 as sender,
      $3 as upload_time,
      $4 as medias_datas,
      $5 as deleted
      FROM
      unnest($6::text[], $7::text[]) as u(postid, content)
    `;
        const insertUpdateHashtagQuery = `
      INSERT INTO hashtags.hashtags_list (
        hashtag, hashtag_count
      )
      VALUES ($1, $2)
      ON CONFLICT (hashtag)
      DO UPDATE SET hashtag_count = hashtags_list.hashtag_count + 1;
    `;
        try {
            yield postsClient.query('BEGIN');
            yield postsClient.query(insertPostDataQuery, [
                postId,
                "post",
                content,
                sender,
                new Date().toISOString(),
                JSON.stringify(mediasDatas),
                false
            ]);
            /*await postsClient.query(insertPostDataQuery2, [
              "post",
              sender,
              new Date().toISOString(),
              JSON.stringify(mediasDatas),
              false,
              uuidArr,
              contentsArr
            ]);*/
            yield postsClient.query('COMMIT');
            yield activitiesLogsClient.query('BEGIN');
            for (var i = 0; i < taggedUsers.length; i++) {
                var taggedUser = taggedUsers[i];
                if (taggedUser != sender) {
                    if ((yield userExists(taggedUser)) && !(yield isBlockedByUser(taggedUser, sender)) && !(yield userIsPrivateAndNotFollowedByCurrentID(taggedUser, sender))) {
                        const insertTaggedUserNotificationDataQuery = `
              INSERT INTO notifications_data.notifications_history (
                type, sender, recipient, referenced_post_id, referenced_post_type, notified_time
              )
              VALUES ($1, $2, $3, $4, $5, $6)
            `;
                        yield activitiesLogsClient.query(insertTaggedUserNotificationDataQuery, [
                            'tagged', sender, taggedUser, postId, 'post', new Date().toISOString()
                        ]);
                    }
                }
            }
            yield activitiesLogsClient.query('COMMIT');
            yield keywordsClient.query('BEGIN');
            for (var i = 0; i < hashtags.length; i++) {
                var hashtag = hashtags[i];
                yield keywordsClient.query(insertUpdateHashtagQuery, [
                    hashtag, 1
                ]);
            }
            yield keywordsClient.query('COMMIT');
            console.log('successful');
            res.json({ message: 'Successfully uploaded the post' });
            console.log('User data inserted successfully');
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield postsClient.query('ROLLBACK');
            console.error('Error uploading post:', error);
            // Send an error response to the postsClient
            res.json({ message: 'Server error' });
        }
    }
    catch (error) {
        console.error('Error uploading post:', error);
        yield postsClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
function userIsPrivateAndNotFollowedByCurrentID(userID, currentID) {
    return __awaiter(this, void 0, void 0, function* () {
        if (userID == currentID) {
            return false;
        }
        ;
        const userIDBasicData = yield getBasicUserProfileData(userID);
        if (userIDBasicData.private) {
            const fetchUserIDFollowersDataQuery = `SELECT * FROM follow_users.follow_history WHERE following_id = $1 AND followed_id = $2`;
            const fetchUserIDFollowersData = yield profilesClient.query(fetchUserIDFollowersDataQuery, [currentID, userID]);
            return fetchUserIDFollowersData.rowCount == 0;
        }
        else {
            return false;
        }
    });
}
function getRequestsDataByUser(userID, searchedRequestedUser) {
    return __awaiter(this, void 0, void 0, function* () {
        const fetchUserIDRequestsDataQuery = `SELECT * FROM follow_requests_users.follow_request_history WHERE requesting_id = $1 AND requested_id = $2`;
        const fetchUserIDRequestsFromData = yield profilesClient.query(fetchUserIDRequestsDataQuery, [userID, searchedRequestedUser]);
        const userIDRequestsFromDataCount = fetchUserIDRequestsFromData.rowCount;
        const fetchUserIDRequestsToData = yield profilesClient.query(fetchUserIDRequestsDataQuery, [searchedRequestedUser, userID]);
        const userIDRequestsToDataCount = fetchUserIDRequestsToData.rowCount;
        return {
            requested_by_current_id: userIDRequestsFromDataCount > 0,
            requests_to_current_id: userIDRequestsToDataCount > 0
        };
    });
}
function isMutedByUser(userID, searchedMutedUser) {
    return __awaiter(this, void 0, void 0, function* () {
        if (userID == searchedMutedUser) {
            return false;
        }
        const fetchUserIDMutedUsersDataQuery = `SELECT * FROM muted_users.mute_history WHERE user_id = $1 AND muted_id = $2`;
        const fetchUserIDMutedUsersData = yield profilesClient.query(fetchUserIDMutedUsersDataQuery, [userID, searchedMutedUser]);
        const userIDMutedUsersDataCount = fetchUserIDMutedUsersData.rowCount;
        return userIDMutedUsersDataCount > 0;
    });
}
function isBlockedByUser(userID, searchedBlockedUser) {
    return __awaiter(this, void 0, void 0, function* () {
        if (userID == searchedBlockedUser) {
            return false;
        }
        const fetchUserIDBlockedUsersDataQuery = `SELECT * FROM blocked_users.block_history WHERE user_id = $1 AND blocked_id = $2`;
        const fetchUserIDBlockedUsersData = yield profilesClient.query(fetchUserIDBlockedUsersDataQuery, [userID, searchedBlockedUser]);
        const userIDBlockedUsersDataCount = fetchUserIDBlockedUsersData.rowCount;
        return userIDBlockedUsersDataCount > 0;
    });
}
function userExists(searchedUser) {
    return __awaiter(this, void 0, void 0, function* () {
        const fetchUserIDExistsUsersDataQuery = `SELECT * FROM basic_data.user_profile WHERE user_id = $1 AND suspended = $2 AND deleted = $3`;
        const fetchUserIDExistsUsersData = yield profilesClient.query(fetchUserIDExistsUsersDataQuery, [searchedUser, false, false]);
        const userIDExistsUsersDataCount = fetchUserIDExistsUsersData.rowCount;
        return userIDExistsUsersDataCount > 0;
    });
}
function getFilteredCompleteUserProfileData(userID, currentID) {
    return __awaiter(this, void 0, void 0, function* () {
        var successfulCode = 100;
        var blacklistedCode = 0;
        var res = {
            data: { basic_data: {}, socials_data: {} },
            code: blacklistedCode
        };
        var relations = {
            muted_by_current_id: false,
            blocked_by_current_id: false,
            blocks_current_id: false,
            requested_by_current_id: false,
            requests_to_current_id: false
        };
        if (yield isMutedByUser(currentID, userID)) {
            relations.muted_by_current_id = true;
        }
        else {
            if (yield isBlockedByUser(currentID, userID)) {
                relations.blocked_by_current_id = true;
            }
            else {
                if (yield isBlockedByUser(userID, currentID)) {
                    relations.blocks_current_id = true;
                }
                else {
                    const userIDProfileData = yield getBasicUserProfileData(userID);
                    if (!userIDProfileData.suspended && !userIDProfileData.deleted) {
                        const userIDSocialsData = yield getUserSocialsData(userID, currentID);
                        var currentIDInUserRequests = yield getRequestsDataByUser(currentID, userID);
                        relations.requested_by_current_id = currentIDInUserRequests.requested_by_current_id;
                        relations.requests_to_current_id = currentIDInUserRequests.requests_to_current_id;
                        res.code = successfulCode;
                        res.data = { basic_data: Object.assign(Object.assign({}, userIDProfileData), relations), socials_data: userIDSocialsData };
                    }
                }
            }
        }
        return res;
    });
}
function getFilteredFromUserIDBasicUserProfileData(userID, currentID) {
    return __awaiter(this, void 0, void 0, function* () {
        var successfulCode = 100;
        var blacklistedCode = 0;
        var res = {
            data: { basic_data: {} },
            code: blacklistedCode
        };
        var relations = {
            blocks_current_id: false,
            muted_by_current_id: yield isMutedByUser(currentID, userID),
            blocked_by_current_id: false,
            requested_by_current_id: false,
            requests_to_current_id: false,
        };
        const userIDProfileData = yield getBasicUserProfileData(userID);
        res.code = successfulCode;
        res.data = { basic_data: Object.assign(Object.assign({}, userIDProfileData), relations) };
        return res;
    });
}
function getCompleteUserProfileData(userID, currentID) {
    return __awaiter(this, void 0, void 0, function* () {
        var res = {
            data: { basic_data: {}, socials_data: {} },
        };
        var currentIDInUserRequests = yield getRequestsDataByUser(currentID, userID);
        console.log(currentIDInUserRequests);
        var relations = {
            muted_by_current_id: yield isMutedByUser(currentID, userID),
            blocked_by_current_id: yield isBlockedByUser(currentID, userID),
            blocks_current_id: yield isBlockedByUser(userID, currentID),
            requested_by_current_id: currentIDInUserRequests.requested_by_current_id,
            requests_to_current_id: currentIDInUserRequests.requests_to_current_id
        };
        const userIDProfileData = yield getBasicUserProfileData(userID);
        const userIDSocialsData = yield getUserSocialsData(userID, currentID);
        res.data = { basic_data: Object.assign(Object.assign({}, userIDProfileData), relations), socials_data: userIDSocialsData };
        return Object.assign({}, res);
    });
}
var RequestType;
(function (RequestType) {
    RequestType[RequestType["From"] = 0] = "From";
    RequestType[RequestType["To"] = 1] = "To";
})(RequestType || (RequestType = {}));
function getRequesterProfileData(userID, currentID, requestType) {
    return __awaiter(this, void 0, void 0, function* () {
        var res = {
            data: { basic_data: {}, socials_data: {} },
        };
        var relations = {
            muted_by_current_id: false,
            blocked_by_current_id: false,
            blocks_current_id: false,
            requested_by_current_id: requestType == RequestType.From ? true : false,
            requests_to_current_id: requestType == RequestType.To ? true : false
        };
        const userIDProfileData = yield getBasicUserProfileData(userID);
        const userIDSocialsData = yield getUserSocialsData(userID, currentID);
        res.data = { basic_data: Object.assign(Object.assign({}, userIDProfileData), relations), socials_data: userIDSocialsData };
        return Object.assign({}, res);
    });
}
function getCompleteUserProfileDataWithUsername(username, currentID) {
    return __awaiter(this, void 0, void 0, function* () {
        const fetchUserIDProfileDataQuery = 'SELECT * FROM basic_data.user_profile WHERE username = $1';
        const fetchUserIDProfileData = yield profilesClient.query(fetchUserIDProfileDataQuery, [username]);
        const userIDProfileData = fetchUserIDProfileData.rows[0];
        var userID = userIDProfileData.user_id;
        var currentIDInUserRequests = yield getRequestsDataByUser(currentID, userID);
        var res = {
            data: { basic_data: {}, socials_data: {} },
        };
        var relations = {
            muted_by_current_id: yield isMutedByUser(currentID, userID),
            blocked_by_current_id: yield isBlockedByUser(currentID, userID),
            blocks_current_id: false,
            requested_by_current_id: currentIDInUserRequests.requested_by_current_id,
            requests_to_current_id: currentIDInUserRequests.requests_to_current_id
        };
        relations.blocks_current_id = yield isBlockedByUser(userID, currentID);
        const userIDSocialsData = yield getUserSocialsData(userID, currentID);
        res.data = { basic_data: Object.assign(Object.assign({}, userIDProfileData), relations), socials_data: userIDSocialsData };
        return Object.assign({}, res);
    });
}
function getBasicUserProfileData(userID) {
    return __awaiter(this, void 0, void 0, function* () {
        const fetchUserIDProfileDataQuery = 'SELECT * FROM basic_data.user_profile WHERE user_id = $1';
        const fetchUserIDProfileData = yield profilesClient.query(fetchUserIDProfileDataQuery, [userID]);
        const userIDProfileData = fetchUserIDProfileData.rows[0];
        var relations = {
            muted_by_current_id: false,
            blocked_by_current_id: false,
            blocks_current_id: false,
            requested_by_current_id: false,
            requests_to_current_id: false
        };
        return Object.assign(Object.assign({}, userIDProfileData), relations);
    });
}
function getUserSocialsData(userID, currentID) {
    return __awaiter(this, void 0, void 0, function* () {
        const fetchUserIDFollowersDataQuery = `SELECT following_id FROM follow_users.follow_history WHERE followed_id = $1`;
        const fetchUserIDFollowersData = yield profilesClient.query(fetchUserIDFollowersDataQuery, [userID]);
        const userIDFollowersData = fetchUserIDFollowersData.rows.map((e) => e.following_id);
        const fetchUserIDFollowingDataQuery = `SELECT followed_id FROM follow_users.follow_history WHERE following_id = $1`;
        const fetchUserIDFollowingData = yield profilesClient.query(fetchUserIDFollowingDataQuery, [userID]);
        const userIDFollowingData = fetchUserIDFollowingData.rows.map((e) => e.followed_id);
        var followedByCurrentID = userIDFollowersData.includes(currentID);
        var followsCurrentID = userIDFollowingData.includes(currentID);
        return {
            followers_count: userIDFollowersData.length,
            following_count: userIDFollowingData.length,
            followed_by_current_id: followedByCurrentID,
            follows_current_id: followsCurrentID
        };
    });
}
usersRoutes.get('/fetchCurrentUserProfile', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { currentID } = req.body;
    console.log(req.body);
    try {
        res.json({ message: "Successfully fetched data",
            userProfileData: yield getBasicUserProfileData(currentID),
        });
    }
    catch (error) {
        console.error('Error fetching user data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchUserProfileSocials', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userID, currentID, } = req.body;
    console.log(req.body);
    try {
        var completeProfileData = yield getCompleteUserProfileData(userID, currentID);
        res.json({ message: "Successfully fetched data",
            userProfileData: completeProfileData.data.basic_data,
            userSocialsData: completeProfileData.data.socials_data
        });
    }
    catch (error) {
        console.error('Error fetching user data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchUserProfileSocialsWithUsername', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, currentID } = req.body;
    console.log(req.body);
    try {
        var userProfileData = yield getCompleteUserProfileDataWithUsername(username, currentID);
        res.json({ message: "Successfully fetched data",
            userProfileData: userProfileData.data.basic_data,
            userSocialsData: userProfileData.data.socials_data,
        });
    }
    catch (error) {
        console.error('Error fetching user data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/editUserProfile', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userID, name, username, profilePicLink, bio, birthDate } = req.body;
    console.log(req.body);
    try {
        const insertEditUserProfileQuery = `
      UPDATE basic_data.user_profile
      SET name = $2, username = $3, profile_picture_link = $4, bio = $5, birth_date = $6
      WHERE user_id = $1
    `;
        try {
            yield profilesClient.query('BEGIN');
            yield profilesClient.query(insertEditUserProfileQuery, [
                userID, name, username, profilePicLink, bio, birthDate
            ]);
            yield profilesClient.query('COMMIT');
            console.log('succcessfully updated user profile');
            res.json({ message: 'Successfully updated user profile' });
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield profilesClient.query('ROLLBACK');
            console.error('Error updating user profile:', error);
            // Send an error response to the profilesClient
            res.json({ message: 'Server error' });
        }
    }
    catch (error) {
        console.error('Error updating profile data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
function getPostEngagementsData(postID, sender, currentID) {
    return __awaiter(this, void 0, void 0, function* () {
        const fetchPostEngagementsDataQuery = `SELECT * FROM public."fetch_post_engagements"($1, $2)`;
        const fetchPostEngagementsData = yield postsClient.query(fetchPostEngagementsDataQuery, [
            currentID, postID
        ]);
        const postEngagementsData = fetchPostEngagementsData.rows[0];
        console.log(postEngagementsData);
        return {
            'liked_by_current_id': postEngagementsData.liked_by_current_id,
            'likes_count': postEngagementsData.likes_count,
            'bookmarked_by_current_id': postEngagementsData.bookmarked_by_current_id,
            'bookmarks_count': postEngagementsData.bookmarks_count,
            'comments_count': postEngagementsData.comments_count
        };
    });
}
function getCommentEngagementsData(commentID, sender, currentID) {
    return __awaiter(this, void 0, void 0, function* () {
        const fetchCommentEngagementsDataQuery = `SELECT * FROM public."fetch_comment_engagements"($1, $2)`;
        const fetchCommentEngagementsData = yield postsClient.query(fetchCommentEngagementsDataQuery, [
            currentID, commentID
        ]);
        const commentEngagementsData = fetchCommentEngagementsData.rows[0];
        console.log(commentEngagementsData);
        return {
            'liked_by_current_id': commentEngagementsData.liked_by_current_id,
            'likes_count': commentEngagementsData.likes_count,
            'bookmarked_by_current_id': commentEngagementsData.bookmarked_by_current_id,
            'bookmarks_count': commentEngagementsData.bookmarks_count,
            'comments_count': commentEngagementsData.comments_count
        };
    });
}
function getPostsListFilteredData(dataList, currentID) {
    return __awaiter(this, void 0, void 0, function* () {
        var completeDataList = [];
        var usersProfileData = [];
        var usersSocialsData = [];
        var usersID = [];
        var blacklistedUsersID = [];
        for (var i = 0; i < dataList.length; i++) {
            console.log(dataList[i].sender);
            console.log(dataList[i].parent_post_sender);
            if (dataList[i].type == 'post') {
                var postData = dataList[i];
                if (!usersID.includes(postData.sender) && !blacklistedUsersID.includes(postData.sender)) {
                    var userProfileData = yield getFilteredCompleteUserProfileData(postData.sender, currentID);
                    if (userProfileData.code == 100) {
                        usersID.push(postData.sender);
                        var engagementsData = yield getPostEngagementsData(postData.post_id, postData.sender, currentID);
                        completeDataList.push(Object.assign(Object.assign({}, postData), engagementsData));
                        usersProfileData.push(userProfileData.data.basic_data);
                        usersSocialsData.push(userProfileData.data.socials_data);
                    }
                    else {
                        blacklistedUsersID.push(postData.sender);
                    }
                }
                else {
                    if (!blacklistedUsersID.includes(postData.sender)) {
                        var engagementsData = yield getPostEngagementsData(postData.post_id, postData.sender, currentID);
                        completeDataList.push(Object.assign(Object.assign({}, postData), engagementsData));
                    }
                }
            }
            else if (dataList[i].type == 'comment') {
                var commentData = dataList[i];
                if (!usersID.includes(commentData.sender) && !blacklistedUsersID.includes(commentData.sender)) {
                    var userProfileData = yield getFilteredCompleteUserProfileData(commentData.sender, currentID);
                    if (userProfileData.code == 100) {
                        usersID.push(commentData.sender);
                        var engagementsData = yield getCommentEngagementsData(commentData.comment_id, commentData.sender, currentID);
                        completeDataList.push(Object.assign(Object.assign({}, commentData), engagementsData));
                        usersProfileData.push(userProfileData.data.basic_data);
                        usersSocialsData.push(userProfileData.data.socials_data);
                        var parentPostSenderID = commentData.parent_post_sender;
                        if (!usersID.includes(parentPostSenderID)) {
                            var parentPostSenderProfileData = yield getCompleteUserProfileData(parentPostSenderID, currentID);
                            usersID.push(parentPostSenderID);
                            usersProfileData.push(parentPostSenderProfileData.data.basic_data);
                            usersSocialsData.push(parentPostSenderProfileData.data.socials_data);
                        }
                    }
                    else {
                        blacklistedUsersID.push(commentData.sender);
                    }
                }
                else {
                    if (!blacklistedUsersID.includes(commentData.sender)) {
                        var engagementsData = yield getCommentEngagementsData(commentData.comment_id, commentData.sender, currentID);
                        completeDataList.push(Object.assign(Object.assign({}, commentData), engagementsData));
                        var parentPostSenderID = commentData.parent_post_sender;
                        if (!usersID.includes(parentPostSenderID)) {
                            var parentPostSenderProfileData = yield getCompleteUserProfileData(parentPostSenderID, currentID);
                            usersID.push(parentPostSenderID);
                            usersProfileData.push(parentPostSenderProfileData.data.basic_data);
                            usersSocialsData.push(parentPostSenderProfileData.data.socials_data);
                        }
                    }
                }
            }
        }
        return {
            completeDataList: completeDataList,
            usersProfileData: usersProfileData,
            usersSocialsData: usersSocialsData,
        };
    });
}
function getPostsListCompleteData(dataList, currentID) {
    return __awaiter(this, void 0, void 0, function* () {
        var completeDataList = [];
        var usersProfileData = [];
        var usersSocialsData = [];
        var usersID = [];
        for (var i = 0; i < dataList.length; i++) {
            if (dataList[i].type == 'post') {
                var postData = dataList[i];
                if (!usersID.includes(postData.sender)) {
                    var userProfileData = yield getCompleteUserProfileData(postData.sender, currentID);
                    usersID.push(postData.sender);
                    var engagementsData = yield getPostEngagementsData(postData.post_id, postData.sender, currentID);
                    completeDataList.push(Object.assign(Object.assign({}, postData), engagementsData));
                    usersProfileData.push(userProfileData.data.basic_data);
                    usersSocialsData.push(userProfileData.data.socials_data);
                }
                else {
                    var engagementsData = yield getPostEngagementsData(postData.post_id, postData.sender, currentID);
                    completeDataList.push(Object.assign(Object.assign({}, postData), engagementsData));
                }
            }
            else if (dataList[i].type == 'comment') {
                var commentData = dataList[i];
                if (!usersID.includes(commentData.sender)) {
                    var userProfileData = yield getCompleteUserProfileData(commentData.sender, currentID);
                    usersID.push(commentData.sender);
                    var engagementsData = yield getCommentEngagementsData(commentData.comment_id, commentData.sender, currentID);
                    completeDataList.push(Object.assign(Object.assign({}, commentData), engagementsData));
                    usersProfileData.push(userProfileData.data.basic_data);
                    usersSocialsData.push(userProfileData.data.socials_data);
                    var parentPostSenderID = commentData.parent_post_sender;
                    if (!usersID.includes(parentPostSenderID)) {
                        var parentPostSenderProfileData = yield getCompleteUserProfileData(parentPostSenderID, currentID);
                        usersID.push(parentPostSenderID);
                        usersProfileData.push(parentPostSenderProfileData.data.basic_data);
                        usersSocialsData.push(parentPostSenderProfileData.data.socials_data);
                    }
                }
                else {
                    var engagementsData = yield getCommentEngagementsData(commentData.comment_id, commentData.sender, currentID);
                    completeDataList.push(Object.assign(Object.assign({}, commentData), engagementsData));
                    var parentPostSenderID = commentData.parent_post_sender;
                    if (!usersID.includes(parentPostSenderID)) {
                        var parentPostSenderProfileData = yield getCompleteUserProfileData(parentPostSenderID, currentID);
                        usersID.push(parentPostSenderID);
                        usersProfileData.push(parentPostSenderProfileData.data.basic_data);
                        usersSocialsData.push(parentPostSenderProfileData.data.socials_data);
                    }
                }
            }
        }
        return {
            completeDataList: completeDataList,
            usersProfileData: usersProfileData,
            usersSocialsData: usersSocialsData,
        };
    });
}
function getUsersListBasicData(dataList, currentID) {
    return __awaiter(this, void 0, void 0, function* () {
        var usersProfileData = [];
        var usersID = [];
        var blacklistedUsersID = [];
        for (var i = 0; i < dataList.length; i++) {
            var userID = dataList[i];
            if (!usersID.includes(userID)) {
                var userProfileData = yield getFilteredFromUserIDBasicUserProfileData(userID, currentID);
                if (userProfileData.code == 100) {
                    usersID.push(userID);
                    usersProfileData.push(userProfileData);
                }
                else {
                    blacklistedUsersID.push(userID);
                }
            }
        }
        return {
            usersProfileData: usersProfileData,
            usersIDList: usersID,
        };
    });
}
function getUsersListCompleteData(dataList, currentID) {
    return __awaiter(this, void 0, void 0, function* () {
        var usersProfileData = [];
        var usersSocialsData = [];
        var usersID = [];
        var blacklistedUsersID = [];
        for (var i = 0; i < dataList.length; i++) {
            var userID = dataList[i];
            if (!usersID.includes(userID)) {
                var userProfileData = yield getCompleteUserProfileData(userID, currentID);
                usersID.push(userID);
                usersProfileData.push(userProfileData.data.basic_data);
                usersSocialsData.push(userProfileData.data.socials_data);
            }
        }
        return {
            usersProfileData: usersProfileData,
            usersSocialsData: usersSocialsData,
            usersIDList: usersID,
        };
    });
}
function getUsersListFilteredData(dataList, currentID) {
    return __awaiter(this, void 0, void 0, function* () {
        var usersProfileData = [];
        var usersSocialsData = [];
        var usersID = [];
        for (var i = 0; i < dataList.length; i++) {
            var userID = dataList[i];
            if (!usersID.includes(userID)) {
                var userProfileData = yield getFilteredCompleteUserProfileData(userID, currentID);
                if (userProfileData.code == 100) {
                    usersID.push(userID);
                    usersProfileData.push(userProfileData.data.basic_data);
                    usersSocialsData.push(userProfileData.data.socials_data);
                }
            }
        }
        return {
            usersProfileData: usersProfileData,
            usersSocialsData: usersSocialsData,
            usersIDList: usersID,
        };
    });
}
usersRoutes.get('/fetchUserPosts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userID, currentID, currentLength, paginationLimit, maxFetchLimit } = req.body;
    console.log(req.body);
    try {
        const fetchUserIDPostsDataQuery = `SELECT * FROM posts_list.posts_data WHERE sender = $1 AND deleted = false ORDER BY upload_time DESC OFFSET $2 LIMIT $3`;
        const fetchUserIDPostsData = yield postsClient.query(fetchUserIDPostsDataQuery, [userID, currentLength, Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1))]);
        const userIDPostsData = fetchUserIDPostsData.rows;
        const dataLength = userIDPostsData.length;
        if (dataLength > paginationLimit) {
            userIDPostsData.pop();
        }
        console.log(userIDPostsData.length);
        var getCompletePostsData = yield getPostsListFilteredData(userIDPostsData, currentID);
        const completePostsList = getCompletePostsData.completeDataList;
        const usersProfileData = getCompletePostsData.usersProfileData;
        const usersSocialsData = getCompletePostsData.usersSocialsData;
        console.log(usersProfileData.length);
        res.json({
            message: "Successfully fetched data",
            userPostsData: completePostsList,
            canPaginate: dataLength > paginationLimit,
            usersProfileData: usersProfileData,
            usersSocialsData: usersSocialsData
        });
        console.log('successfully fetched data');
    }
    catch (error) {
        console.error('Error fetching user data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchUserComments', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userID, currentID, currentLength, paginationLimit, maxFetchLimit } = req.body;
    console.log(req.body);
    try {
        const fetchUserIDRepliesDataQuery = `SELECT * FROM comments_list.comments_data WHERE sender = $1 AND deleted = false ORDER BY upload_time DESC OFFSET $2 LIMIT $3`;
        const fetchUserIDRepliesData = yield postsClient.query(fetchUserIDRepliesDataQuery, [
            userID,
            currentLength,
            Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1))
        ]);
        const userIDRepliesData = fetchUserIDRepliesData.rows;
        const dataLength = userIDRepliesData.length;
        if (dataLength > paginationLimit) {
            userIDRepliesData.pop();
        }
        var getCompletePostsData = yield getPostsListFilteredData(userIDRepliesData, currentID);
        const completePostsList = getCompletePostsData.completeDataList;
        const usersProfileData = getCompletePostsData.usersProfileData;
        const usersSocialsData = getCompletePostsData.usersSocialsData;
        res.json({ message: "Successfully fetched data", userCommentsData: completePostsList, canPaginate: dataLength > paginationLimit,
            usersProfileData: usersProfileData, usersSocialsData: usersSocialsData });
    }
    catch (error) {
        console.error('Error fetching user data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchUserBookmarks', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userID, currentID, currentLength, paginationLimit, maxFetchLimit } = req.body;
    console.log(req.body);
    try {
        const fetchBookmarksDataQuery = `SELECT * FROM public."fetch_user_bookmarks"($1, $2, $3, $4, $5, $6, $7)`;
        const fetchBookmarksData = yield postsClient.query(fetchBookmarksDataQuery, [
            currentID,
            currentLength,
            Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1)),
            username, IP, PORT, password
        ]);
        const bookmarksData = fetchBookmarksData.rows;
        console.log(bookmarksData);
        const dataLength = bookmarksData.length;
        if (dataLength > paginationLimit) {
            bookmarksData.pop();
        }
        ;
        console.log(bookmarksData);
        bookmarksData.forEach((e, i) => {
            bookmarksData[i] = e.post_data;
        });
        var getCompletePostsData = yield getPostsListCompleteData(bookmarksData, currentID);
        const completePostsList = getCompletePostsData.completeDataList;
        const usersProfileData = getCompletePostsData.usersProfileData;
        const usersSocialsData = getCompletePostsData.usersSocialsData;
        res.json({
            message: "Successfully fetched data", userBookmarksData: completePostsList,
            usersProfileData: usersProfileData, usersSocialsData: usersSocialsData,
            canPaginate: dataLength > paginationLimit
        });
    }
    catch (error) {
        console.error('Error fetching user data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchFeed', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userID, currentLength, paginationLimit, maxFetchLimit } = req.body;
    console.log(req.body);
    try {
        const fetchFollowingDataQuery = `SELECT * FROM public."fetch_feed" ($1, $2, $3, $4, $5, $6, $7)`;
        const fetchFollowingData = yield postsClient.query(fetchFollowingDataQuery, [
            userID, 0, maxFetchLimit, username, IP, PORT, password
        ]);
        for (var i = 0; i < 50; i++) {
            console.log(fetchFollowingData.rows.length);
        }
        const feedPosts = fetchFollowingData.rows.map((e) => e.post_data);
        const totalPostsLength = Math.min(maxFetchLimit, feedPosts.length);
        var modifiedFeedPosts = [...feedPosts];
        modifiedFeedPosts = modifiedFeedPosts.slice(0, Math.min(feedPosts.length - currentLength, paginationLimit));
        var getCompletePostsData = yield getPostsListFilteredData(modifiedFeedPosts, userID);
        const completePostsList = getCompletePostsData.completeDataList;
        var usersProfileData = getCompletePostsData.usersProfileData;
        var usersSocialsData = getCompletePostsData.usersSocialsData;
        if (usersProfileData.find((e) => e.user_id == userID) == null) {
            var currentUserCompleteData = yield getCompleteUserProfileData(userID, userID);
            usersProfileData.push(currentUserCompleteData.data.basic_data);
            usersSocialsData.push(currentUserCompleteData.data.socials_data);
        }
        console.log('successfully fetched feed');
        res.json({
            'message': "Successfully fetched data",
            'usersProfileData': usersProfileData,
            'usersSocialsData': usersSocialsData,
            'feedPosts': feedPosts,
            'modifiedFeedPosts': completePostsList,
            'totalPostsLength': totalPostsLength,
        });
    }
    catch (error) {
        console.error('Error fetching user data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchFeedPagination', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var { userID, feedPostsEncoded, } = req.body;
    try {
        var modifiedFeedPosts = JSON.parse(feedPostsEncoded);
        var getCompletePostsData = yield getPostsListFilteredData(modifiedFeedPosts, userID);
        const completePostsList = getCompletePostsData.completeDataList;
        const usersProfileData = getCompletePostsData.usersProfileData;
        const usersSocialsData = getCompletePostsData.usersSocialsData;
        console.log('successfully fetched feed pagination');
        res.json({
            'message': "Successfully fetched data",
            'usersProfileData': usersProfileData,
            'usersSocialsData': usersSocialsData,
            'modifiedFeedPosts': completePostsList,
        });
    }
    catch (error) {
        console.error('Error fetching user data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/likePost', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { currentID, sender, postID, } = req.body;
    console.log(req.body);
    try {
        const insertLikePostQuery = `
      INSERT INTO likes_list.posts (
        user_id, post_id
      )
      VALUES ($1, $2)
    `;
        const insertNewANotificationDataQuery = `
      INSERT INTO notifications_data.notifications_history (
        type, sender, recipient, referenced_post_id, referenced_post_type, notified_time
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
        try {
            if ((yield userExists(sender)) && !(yield isBlockedByUser(sender, currentID)) && !(yield userIsPrivateAndNotFollowedByCurrentID(sender, currentID))) {
                yield postsClient.query('BEGIN');
                yield postsClient.query(insertLikePostQuery, [
                    currentID, postID
                ]);
                yield postsClient.query('COMMIT');
                yield activitiesLogsClient.query('BEGIN');
                if (sender != currentID) {
                    if (!(yield isBlockedByUser(currentID, sender)) && !(yield isMutedByUser(sender, currentID))) {
                        yield activitiesLogsClient.query(insertNewANotificationDataQuery, [
                            'like', currentID, sender, postID, 'post', new Date().toISOString()
                        ]);
                    }
                }
                yield activitiesLogsClient.query('COMMIT');
                console.log('succcessfully liked');
                res.json({ message: 'Successfully liked the post' });
            }
            else {
                res.json({ message: 'Failed to like' });
            }
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield postsClient.query('ROLLBACK');
            console.error('Error liking post:', error);
            // Send an error response to the profilesClient
            res.json({ message: 'Server error' });
        }
    }
    catch (error) {
        console.error('Error liking post:', error);
        yield postsClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/unlikePost', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { currentID, sender, postID, } = req.body;
    console.log(req.body);
    try {
        const insertUnlikePostQuery = `
      DELETE FROM likes_list.posts WHERE user_id = $1 AND post_id = $2;
    `;
        try {
            if ((yield userExists(sender)) && !(yield isBlockedByUser(sender, currentID)) && !(yield userIsPrivateAndNotFollowedByCurrentID(sender, currentID))) {
                yield postsClient.query('BEGIN');
                yield postsClient.query(insertUnlikePostQuery, [
                    currentID, postID
                ]);
                yield postsClient.query('COMMIT');
                res.json({ message: 'Successfully unliked the post' });
            }
            else {
                res.json({ message: 'failed to unlike' });
            }
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield profilesClient.query('ROLLBACK');
            console.error('Error unliking post:', error);
            // Send an error response to the profilesClient
            res.json({ message: 'Server error' });
        }
    }
    catch (error) {
        console.error('Error unliking post:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/bookmarkPost', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { currentID, sender, postID, } = req.body;
    console.log(req.body);
    try {
        const insertBookmarkPostQuery = `
      INSERT INTO bookmarks_list.posts (
        user_id, post_id, sender, bookmarked_time
      )
      VALUES ($1, $2, $3, $4)
    `;
        const fetchPostDataQuery = `
      SELECT * FROM posts_list.posts_data WHERE sender = $1 AND post_id = $2 AND deleted = $3;
    `;
        const fetchPostData = yield postsClient.query(fetchPostDataQuery, [
            sender, postID, JSON.stringify(false)
        ]);
        const postDataList = fetchPostData.rows;
        const insertNewANotificationDataQuery = `
      INSERT INTO notifications_data.notifications_history (
        type, sender, recipient, referenced_post_id, referenced_post_type, notified_time
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
        if (postDataList.length > 0) {
            try {
                if ((yield userExists(sender)) && !(yield isBlockedByUser(sender, currentID)) && !(yield userIsPrivateAndNotFollowedByCurrentID(sender, currentID))) {
                    var postData = postDataList[0];
                    yield postsClient.query('BEGIN');
                    yield postsClient.query(insertBookmarkPostQuery, [currentID, postID, sender, new Date()]);
                    yield postsClient.query('COMMIT');
                    yield activitiesLogsClient.query('BEGIN');
                    if (sender != currentID) {
                        if (!(yield isBlockedByUser(currentID, sender)) && !(yield isMutedByUser(sender, currentID))) {
                            yield activitiesLogsClient.query(insertNewANotificationDataQuery, [
                                'bookmark', currentID, sender, postID, 'post', new Date().toISOString()
                            ]);
                        }
                    }
                    yield activitiesLogsClient.query('COMMIT');
                    console.log('succcessfully bookmarked');
                    res.json({ message: 'Successfully bookmarked the post' });
                }
                else {
                    res.json({ message: 'failed to bookmark' });
                }
            }
            catch (error) {
                // Rollback the transaction if any error occurs
                yield postsClient.query('ROLLBACK');
                console.error('Error voicing post:', error);
                // Send an error response to the profilesClient
                res.json({ message: 'Server error' });
            }
        }
        else {
            res.json({
                'message': 'failed to bookmark post'
            });
        }
    }
    catch (error) {
        console.error('Error voicing post:', error);
        yield postsClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/unbookmarkPost', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { currentID, sender, postID, } = req.body;
    console.log(req.body);
    try {
        const deleteBookmarkFromTableQuery2 = `
      DELETE FROM bookmarks_list.posts WHERE user_id = $1 AND post_id = $2
    `;
        try {
            if ((yield userExists(sender)) && !(yield isBlockedByUser(sender, currentID)) && !(yield userIsPrivateAndNotFollowedByCurrentID(sender, currentID))) {
                yield postsClient.query('BEGIN');
                yield postsClient.query(deleteBookmarkFromTableQuery2, [
                    currentID, postID
                ]);
                yield postsClient.query('COMMIT');
                console.log('succcessfully unbookmarked');
                res.json({ message: 'Successfully unbookmarked the post' });
            }
            else {
                res.json({ message: 'failed to unbookmark' });
            }
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield postsClient.query('ROLLBACK');
            console.error('Error unvoicing post:', error);
            // Send an error response to the profilesClient
            res.json({ message: 'Server error' });
        }
    }
    catch (error) {
        console.error('Error unvoicing post:', error);
        yield postsClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/deletePost', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sender, postID, } = req.body;
    console.log(req.body);
    try {
        const insertDeletePostQuery = `
      UPDATE posts_list.posts_data
      SET deleted = ${JSON.stringify(true)}
      WHERE sender = $1 AND post_id = $2
    `;
        try {
            yield postsClient.query('BEGIN');
            yield postsClient.query(insertDeletePostQuery, [
                sender, postID
            ]);
            yield postsClient.query('COMMIT');
            console.log('succcessfully deleted');
            res.json({ message: 'Successfully deleted the post' });
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield profilesClient.query('ROLLBACK');
            console.error('Error deleting post:', error);
            // Send an error response to the profilesClient
            res.json({ message: 'Server error' });
        }
    }
    catch (error) {
        console.error('Error deleting post:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.post('/uploadComment', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentID, content, sender, mediasDatas, parentPostID, parentPostSender, parentPostType, hashtags, taggedUsers } = req.body;
    console.log(req.body);
    try {
        const insertCommentDataQuery = `
      INSERT INTO comments_list.comments_data (
        comment_id, type, content, sender, upload_time, medias_datas, parent_post_type, 
        parent_post_id, parent_post_sender, deleted
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;
        const insertNewANotificationDataQuery = `
      INSERT INTO notifications_data.notifications_history (
        type, sender, recipient, referenced_post_id, referenced_post_type, notified_time
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
        const insertUpdateHashtagQuery = `
      INSERT INTO hashtags.hashtags_list (
        hashtag, hashtag_count
      )
      VALUES ($1, $2)
      ON CONFLICT (hashtag)
      DO UPDATE SET hashtag_count = hashtags_list.hashtag_count + 1;
    `;
        //var uuidArr = new Array(1000000).fill(0).map(() => uuidv4());
        //var contentsArr = new Array(1000000).fill(0).map((e, i) => `codebase eminem ${Math.random() * 100000} elitshadye ${i}`);
        const insertCommentDataQuery2 = `
      INSERT INTO comments_list.comments_data (
        comment_id, type, content, sender, upload_time, medias_datas, parent_post_type, 
        parent_post_id, parent_post_sender, deleted
      )
      SELECT
      commentid as comment_id,
      $1 as type,
      content as content,
      $2 as sender,
      $3 as upload_time,
      $4 as medias_datas,
      $5 as parent_post_type,
      $6 as parent_post_id,
      $7 as parent_post_sender,
      $8 as deleted
      FROM
      unnest($9::text[], $10::text[]) as u(commentid, content)
    `;
        try {
            if ((yield userExists(parentPostSender)) && !(yield isBlockedByUser(parentPostSender, sender))) {
                yield postsClient.query('BEGIN');
                yield postsClient.query(insertCommentDataQuery, [
                    commentID,
                    "comment",
                    content,
                    sender,
                    new Date().toISOString(),
                    JSON.stringify(mediasDatas),
                    parentPostType,
                    parentPostID,
                    parentPostSender,
                    false
                ]);
                /*await postsClient.query(insertCommentDataQuery2, [
                  "comment",
                  sender,
                  new Date().toISOString(),
                  JSON.stringify(mediasDatas),
                  parentPostType,
                  parentPostID,
                  parentPostSender,
                  false,
                  uuidArr,
                  contentsArr
                ]);*/
                yield postsClient.query('COMMIT');
                yield activitiesLogsClient.query('BEGIN');
                if (sender != parentPostSender) {
                    if (!(yield isBlockedByUser(sender, parentPostSender)) && !(yield isMutedByUser(parentPostSender, sender))) {
                        yield activitiesLogsClient.query(insertNewANotificationDataQuery, [
                            'upload_comment', sender, parentPostSender, commentID, 'comment', new Date().toISOString()
                        ]);
                    }
                }
                for (var i = 0; i < taggedUsers.length; i++) {
                    var taggedUser = taggedUsers[i];
                    if (taggedUser != sender) {
                        if ((yield userExists(taggedUser)) && !(yield isBlockedByUser(taggedUser, sender)) && !(yield userIsPrivateAndNotFollowedByCurrentID(taggedUser, sender))) {
                            const insertTaggedUserNotificationDataQuery = `
                INSERT INTO notifications_data.notifications_history (
                  type, sender, recipient, referenced_post_id, referenced_post_type, notified_time
                )
                VALUES ($1, $2, $3, $4, $5, $6)
              `;
                            yield activitiesLogsClient.query(insertTaggedUserNotificationDataQuery, [
                                'tagged', sender, taggedUser, commentID, 'comment', new Date().toISOString()
                            ]);
                        }
                    }
                }
                yield activitiesLogsClient.query('COMMIT');
                yield keywordsClient.query('BEGIN');
                for (var i = 0; i < hashtags.length; i++) {
                    var hashtag = hashtags[i];
                    yield keywordsClient.query(insertUpdateHashtagQuery, [
                        hashtag, 1
                    ]);
                }
                yield keywordsClient.query('COMMIT');
                console.log('successful');
                res.json({ message: 'Successfully uploaded the comment' });
            }
            else {
                res.json({ message: 'failed to comment' });
            }
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield postsClient.query('ROLLBACK');
            console.error('Error uploading comment:', error);
            // Send an error response to the postsClient
            res.json({ message: 'Server error' });
        }
    }
    catch (error) {
        console.error('Error uploading post:', error);
        yield postsClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/likeComment', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { currentID, sender, commentID, } = req.body;
    console.log(req.body);
    try {
        const insertLikeCommentQuery = `
      INSERT INTO likes_list.comments (
        user_id, comment_id
      )
      VALUES ($1, $2)
    `;
        const insertNewANotificationDataQuery = `
      INSERT INTO notifications_data.notifications_history (
        type, sender, recipient, referenced_post_id, referenced_post_type, notified_time
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
        try {
            if ((yield userExists(sender)) && !(yield isBlockedByUser(sender, currentID)) && !(yield userIsPrivateAndNotFollowedByCurrentID(sender, currentID))) {
                yield postsClient.query('BEGIN');
                yield postsClient.query(insertLikeCommentQuery, [
                    currentID, commentID
                ]);
                yield postsClient.query('COMMIT');
                yield activitiesLogsClient.query('BEGIN');
                if (sender != currentID) {
                    if (!(yield isBlockedByUser(currentID, sender)) && !(yield isMutedByUser(sender, currentID))) {
                        yield activitiesLogsClient.query(insertNewANotificationDataQuery, [
                            'like', currentID, sender, commentID, 'comment', new Date().toISOString()
                        ]);
                    }
                }
                yield activitiesLogsClient.query('COMMIT');
                console.log('succcessfully liked');
                res.json({ message: 'Successfully liked the comment' });
            }
            else {
                res.json({ message: 'failed to like' });
            }
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield profilesClient.query('ROLLBACK');
            console.error('Error liking comment:', error);
            // Send an error response to the profilesClient
            res.json({ message: 'Server error' });
        }
    }
    catch (error) {
        console.error('Error liking comment:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/unlikeComment', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { currentID, sender, commentID, } = req.body;
    console.log(req.body);
    try {
        const insertUnlikeCommentQuery = `
      DELETE FROM likes_list.comments WHERE user_id = $1 AND comment_id = $2;
    `;
        try {
            if ((yield userExists(sender)) && !(yield isBlockedByUser(sender, currentID)) && !(yield userIsPrivateAndNotFollowedByCurrentID(sender, currentID))) {
                yield postsClient.query('BEGIN');
                yield postsClient.query(insertUnlikeCommentQuery, [
                    currentID, commentID
                ]);
                yield postsClient.query('COMMIT');
                res.json({ message: 'Successfully unliked the comment' });
            }
            else {
                res.json({ message: 'failed to unlike' });
            }
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield profilesClient.query('ROLLBACK');
            console.error('Error unliking comment:', error);
            // Send an error response to the profilesClient
            res.json({ message: 'Server error' });
        }
    }
    catch (error) {
        console.error('Error unliking comment:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/bookmarkComment', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { currentID, sender, commentID, } = req.body;
    console.log(req.body);
    try {
        const insertBookmarkCommentQuery = `
      INSERT INTO bookmarks_list.comments (
        user_id, comment_id, sender, bookmarked_time
      )
      VALUES ($1, $2, $3, $4)
    `;
        const fetchCommentDataQuery = `
      SELECT * FROM comments_list.comments_data WHERE sender = $1 AND comment_id = $2 AND deleted = $3;
    `;
        const fetchCommentData = yield postsClient.query(fetchCommentDataQuery, [
            sender,
            commentID, JSON.stringify(false)
        ]);
        const commentDataList = fetchCommentData.rows;
        const insertNewANotificationDataQuery = `
      INSERT INTO notifications_data.notifications_history (
        type, sender, recipient, referenced_post_id, referenced_post_type, notified_time
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
        if (commentDataList.length > 0) {
            try {
                if ((yield userExists(sender)) && !(yield isBlockedByUser(sender, currentID)) && !(yield userIsPrivateAndNotFollowedByCurrentID(sender, currentID))) {
                    var commentData = commentDataList[0];
                    yield postsClient.query('BEGIN');
                    yield postsClient.query(insertBookmarkCommentQuery, [currentID, commentID, sender, new Date()]);
                    yield postsClient.query('COMMIT');
                    yield activitiesLogsClient.query('BEGIN');
                    if (sender != currentID) {
                        if (!(yield isBlockedByUser(currentID, sender)) && !(yield isMutedByUser(sender, currentID))) {
                            yield activitiesLogsClient.query(insertNewANotificationDataQuery, [
                                'bookmark', currentID, sender, commentID, 'comment', new Date().toISOString()
                            ]);
                        }
                    }
                    yield activitiesLogsClient.query('COMMIT');
                    console.log('succcessfully bookmarked');
                    res.json({ message: 'Successfully bookmarked the comment' });
                }
                else {
                    res.json({ message: 'failed to bookmark' });
                }
            }
            catch (error) {
                // Rollback the transaction if any error occurs
                yield postsClient.query('ROLLBACK');
                console.error('Error voicing comment:', error);
                // Send an error response to the profilesClient
                res.json({ message: 'Server error' });
            }
        }
        else {
            res.json({
                'message': 'failed to bookmark comment'
            });
        }
    }
    catch (error) {
        console.error('Error voicing comment:', error);
        yield postsClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/unbookmarkComment', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { currentID, sender, commentID, } = req.body;
    console.log(req.body);
    try {
        const deleteBookmarkFromTableQuery2 = `
      DELETE FROM bookmarks_list.comments WHERE user_id = $1 AND comment_id = $2
    `;
        try {
            if ((yield userExists(sender)) && !(yield isBlockedByUser(sender, currentID)) && !(yield userIsPrivateAndNotFollowedByCurrentID(sender, currentID))) {
                yield postsClient.query('BEGIN');
                yield postsClient.query(deleteBookmarkFromTableQuery2, [
                    currentID, commentID
                ]);
                yield postsClient.query('COMMIT');
                console.log('succcessfully unbookmarked');
                res.json({ message: 'Successfully unbookmarked the comment' });
            }
            else {
                res.json({ message: 'failed to unbookmark' });
            }
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield postsClient.query('ROLLBACK');
            console.error('Error unvoicing comment:', error);
            // Send an error response to the profilesClient
            res.json({ message: 'Server error' });
        }
    }
    catch (error) {
        console.error('Error unvoicing comment:', error);
        yield postsClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/deleteComment', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sender, commentID, parentPostType, parentPostID, parentPostSender } = req.body;
    console.log(req.body);
    try {
        const insertDeleteCommentQuery = `
      UPDATE comments_list.comments_data
      SET deleted = ${JSON.stringify(true)}
      WHERE sender = $1 AND comment_id = $2
    `;
        try {
            yield postsClient.query('BEGIN');
            yield postsClient.query(insertDeleteCommentQuery, [
                sender,
                commentID
            ]);
            yield postsClient.query('COMMIT');
            console.log('succcessfully deleted');
            res.json({ message: 'Successfully deleted the comment' });
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield profilesClient.query('ROLLBACK');
            console.error('Error deleting comment:', error);
            // Send an error response to the profilesClient
            res.json({ message: 'Server error' });
        }
    }
    catch (error) {
        console.error('Error deleting comment:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
function followUser(followedID, followingID, filterPrivate) {
    return __awaiter(this, void 0, void 0, function* () {
        const insertUpdateFollowedUserSocialsQuery = `
    INSERT INTO follow_users.follow_history (following_id, followed_id, follow_time)
    VALUES ($1, $2, $3)
  `;
        const insertNewANotificationDataQuery = `
    INSERT INTO notifications_data.notifications_history (
      type, sender, recipient, referenced_post_id, referenced_post_type, notified_time
    )
    VALUES ($1, $2, $3, $4, $5, $6)
  `;
        try {
            var isPrivateAndNotFollowedBool = false;
            if (filterPrivate) {
                isPrivateAndNotFollowedBool = yield userIsPrivateAndNotFollowedByCurrentID(followedID, followingID);
            }
            if ((yield userExists(followedID)) && !(yield isBlockedByUser(followedID, followingID)) && !(yield isBlockedByUser(followingID, followedID)) && !isPrivateAndNotFollowedBool) {
                yield profilesClient.query(insertUpdateFollowedUserSocialsQuery, [
                    followingID, followedID, new Date()
                ]);
                yield activitiesLogsClient.query('BEGIN');
                yield activitiesLogsClient.query(insertNewANotificationDataQuery, [
                    'follow', followingID, followedID, '', '', new Date().toISOString()
                ]);
                yield activitiesLogsClient.query('COMMIT');
                console.log('successfully followed');
                return ({ message: 'Successfully followed user' });
            }
            else {
                return ({ message: 'User has been blocked' });
            }
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield profilesClient.query('ROLLBACK');
            console.error('Error following user:', error);
            // Send an error response to the profilesClient
        }
    });
}
function sendFollowRequest(requestedID, requestingID) {
    return __awaiter(this, void 0, void 0, function* () {
        const insertUpdateCurrentUserRequestQuery = `
    INSERT INTO follow_requests_users.follow_request_history (requesting_id, requested_id, request_time)
    VALUES ($1, $2, $3)
  `;
        try {
            if ((yield userExists(requestedID)) && !(yield isBlockedByUser(requestedID, requestingID)) && !(yield isBlockedByUser(requestingID, requestedID))) {
                yield profilesClient.query('BEGIN');
                yield profilesClient.query(insertUpdateCurrentUserRequestQuery, [
                    requestingID, requestedID, new Date()
                ]);
                yield profilesClient.query('COMMIT');
                console.log('successfully requested');
                return ({ message: 'Successfully send request to user' });
            }
            else {
                return ({ message: 'User has been blocked' });
            }
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield profilesClient.query('ROLLBACK');
            console.error('Error requested user:', error);
        }
    });
}
usersRoutes.patch('/followUser', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { currentID, followedID, } = req.body;
    try {
        var followedUserBasicData = yield getBasicUserProfileData(followedID);
        var message;
        yield profilesClient.query('BEGIN');
        if (followedUserBasicData.private) {
            console.log('send follow reqiues');
            message = yield sendFollowRequest(followedID, currentID);
        }
        else {
            console.log('follow directly');
            message = yield followUser(followedID, currentID, true);
        }
        yield profilesClient.query('COMMIT');
        res.json({ message: message });
    }
    catch (error) {
        // Rollback the transaction if any error occurs
        yield profilesClient.query('ROLLBACK');
        console.error('Error following user:', error);
        // Send an error response to the profilesClient
        res.json({ message: 'Server error' });
    }
}));
usersRoutes.patch('/unfollowUser', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { currentID, followedID, } = req.body;
    try {
        const insertUpdateFollowedUserSocialsQuery = `DELETE FROM follow_users.follow_history WHERE following_id = $1 AND followed_id = $2;`;
        try {
            yield profilesClient.query('BEGIN');
            yield profilesClient.query(insertUpdateFollowedUserSocialsQuery, [
                currentID, followedID
            ]);
            yield profilesClient.query('COMMIT');
            console.log('successfully followed');
            res.json({ message: 'Successfully followed user' });
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield profilesClient.query('ROLLBACK');
            console.error('Error following user:', error);
            // Send an error response to the profilesClient
            res.json({ message: 'Server error' });
        }
    }
    catch (error) {
        console.error('Error following user:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchUserProfileFollowers', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userID, currentID, currentLength, paginationLimit, maxFetchLimit } = req.body;
    console.log(req.body);
    try {
        const fetchUserProfileFollowersQuery = `SELECT * FROM public."fetch_user_followers"($1, $2, $3, $4)`;
        const fetchUserProfileFollowers = yield profilesClient.query(fetchUserProfileFollowersQuery, [
            userID,
            currentID,
            currentLength,
            Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1)),
        ]);
        const userProfileFollowers = fetchUserProfileFollowers.rows.map((e) => e.user_id);
        const dataLength = userProfileFollowers.length;
        if (dataLength > paginationLimit) {
            userProfileFollowers.pop();
        }
        var getCompleteUsersData = yield getUsersListCompleteData(userProfileFollowers, currentID);
        const usersProfileData = getCompleteUsersData.usersProfileData;
        const usersSocialsData = getCompleteUsersData.usersSocialsData;
        res.json({
            message: "Successfully fetched data", usersProfileData: usersProfileData,
            usersSocialsData, canPaginate: dataLength > paginationLimit,
        });
    }
    catch (error) {
        console.error('Error during fetching user followers:', error);
        res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchUserProfileFollowing', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userID, currentID, currentLength, paginationLimit, maxFetchLimit } = req.body;
    console.log(req.body);
    try {
        const fetchUserProfileFollowingQuery = `SELECT * FROM public."fetch_user_following"($1, $2, $3, $4)`;
        const fetchUserProfileFollowing = yield profilesClient.query(fetchUserProfileFollowingQuery, [
            userID,
            currentID,
            currentLength,
            Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1))
        ]);
        const userProfileFollowing = fetchUserProfileFollowing.rows.map((e) => e.user_id);
        const dataLength = userProfileFollowing.length;
        if (dataLength > paginationLimit) {
            userProfileFollowing.pop();
        }
        var getCompleteUsersData = yield getUsersListCompleteData(userProfileFollowing, currentID);
        const usersProfileData = getCompleteUsersData.usersProfileData;
        const usersSocialsData = getCompleteUsersData.usersSocialsData;
        res.json({
            message: "Successfully fetched data", usersProfileData: usersProfileData,
            usersSocialsData, canPaginate: dataLength > paginationLimit,
        });
    }
    catch (error) {
        console.error('Error during fetching user following:', error);
        res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchSelectedPostComments', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sender, postID, currentID, currentLength, paginationLimit, maxFetchLimit } = req.body;
    try {
        console.log(req.body);
        const fetchSelectedPostDataQuery = `SELECT * FROM posts_list.posts_data WHERE sender = $1 AND post_id = $2`;
        const fetchSelectedPostData = yield postsClient.query(fetchSelectedPostDataQuery, [sender, postID]);
        var selectedPostData = fetchSelectedPostData.rows[0];
        console.log('1');
        var getCompleteUsersData = yield getUsersListCompleteData([sender], currentID);
        var usersProfileData = getCompleteUsersData.usersProfileData;
        var usersSocialsData = getCompleteUsersData.usersSocialsData;
        const selectedPostEngagementsData = yield getPostEngagementsData(selectedPostData.post_id, selectedPostData.sender, currentID);
        selectedPostData = Object.assign(Object.assign({}, selectedPostData), selectedPostEngagementsData);
        const fetchPostCommentsQuery = `SELECT * FROM public."fetch_post_comments"($1, $2, $3, $4, $5, $6, $7, $8)`;
        const fetchPostComments = yield postsClient.query(fetchPostCommentsQuery, [
            postID, currentID, currentLength, Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1)),
            username, IP, PORT, password
        ]);
        const postComments = fetchPostComments.rows.map((e) => e.post_data);
        const dataLength = postComments.length;
        if (dataLength > paginationLimit) {
            postComments.pop();
        }
        var getCompletePostsData = yield getPostsListCompleteData(postComments, currentID);
        const completePostsList = getCompletePostsData.completeDataList;
        usersProfileData.push(...getCompletePostsData.usersProfileData);
        usersSocialsData.push(...getCompletePostsData.usersSocialsData);
        console.log('successfully fetching post data');
        console.log(postComments.length);
        res.json({
            message: 'Successfully fetched data', usersProfileData: usersProfileData,
            usersSocialsData: usersSocialsData, commentsData: completePostsList,
            canPaginate: dataLength > paginationLimit, selectedPostData: selectedPostData
        });
    }
    catch (error) {
        console.error('Error fetching post data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchSelectedPostCommentsPagination', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sender, postID, currentID, currentLength, paginationLimit, maxFetchLimit } = req.body;
    try {
        console.log(req.body);
        var commentsData = [];
        const fetchPostCommentsQuery = `SELECT * FROM public."fetch_post_comments"($1, $2, $3, $4, $5, $6, $7, $8)`;
        const fetchPostComments = yield postsClient.query(fetchPostCommentsQuery, [
            postID, currentID, currentLength, Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1)),
            username, IP, PORT, password
        ]);
        const postComments = fetchPostComments.rows.map((e) => e.post_data);
        const dataLength = postComments.length;
        if (dataLength > paginationLimit) {
            postComments.pop();
        }
        var getCompletePostsData = yield getPostsListCompleteData(postComments, currentID);
        const completePostsList = getCompletePostsData.completeDataList;
        const usersProfileData = getCompletePostsData.usersProfileData;
        const usersSocialsData = getCompletePostsData.usersSocialsData;
        console.log('successfully fetching post data pagination');
        res.json({
            message: 'Successfully fetched data', usersProfileData: usersProfileData,
            usersSocialsData: usersSocialsData, commentsData: completePostsList,
            canPaginate: dataLength > paginationLimit
        });
    }
    catch (error) {
        console.error('Error fetching post data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchSelectedCommentComments', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sender, commentID, currentID, currentLength, paginationLimit, maxFetchLimit } = req.body;
    try {
        console.log(req.body);
        const fetchSelectedCommentDataQuery = `SELECT * FROM comments_list.comments_data WHERE sender = $1 AND comment_id = $2`;
        const fetchSelectedCommentData = yield postsClient.query(fetchSelectedCommentDataQuery, [sender, commentID]);
        var selectedCommentData = fetchSelectedCommentData.rows[0];
        const selectedCommentEngagementsData = yield getCommentEngagementsData(selectedCommentData.comment_id, selectedCommentData.sender, currentID);
        selectedCommentData = Object.assign(Object.assign({}, selectedCommentData), selectedCommentEngagementsData);
        var parentPostSender = selectedCommentData.parent_post_sender;
        var parentPostID = selectedCommentData.parent_post_id;
        var parentPostType = selectedCommentData.parent_post_type;
        var getCompleteUsersData = yield getUsersListCompleteData([parentPostSender, sender], currentID);
        const usersProfileData = getCompleteUsersData.usersProfileData;
        const usersSocialsData = getCompleteUsersData.usersSocialsData;
        console.log(selectedCommentData);
        const fetchParentPostDataQuery = parentPostType == 'post' ?
            `SELECT * FROM posts_list.posts_data WHERE sender = $1 AND post_id = $2`
            :
                `SELECT * FROM comments_list.comments_data WHERE sender = $1 AND comment_id = $2`;
        const fetchParentPostData = yield postsClient.query(fetchParentPostDataQuery, [parentPostSender, parentPostID]);
        var parentPostData = fetchParentPostData.rows[0];
        const parentPostEngagementsData = parentPostType == 'post' ?
            yield getPostEngagementsData(parentPostData.post_id, parentPostData.sender, currentID)
            :
                yield getCommentEngagementsData(parentPostData.comment_id, parentPostData.sender, currentID);
        parentPostData = Object.assign(Object.assign({}, parentPostData), parentPostEngagementsData);
        console.log('DSHDDJDD');
        const fetchCommentCommentsQuery = `SELECT * FROM public."fetch_comment_comments"($1, $2, $3, $4, $5, $6, $7, $8)`;
        const fetchCommentComments = yield postsClient.query(fetchCommentCommentsQuery, [
            commentID, currentID, currentLength, Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1)),
            username, IP, PORT, password
        ]);
        const commentComments = fetchCommentComments.rows.map((e) => e.post_data);
        const dataLength = commentComments.length;
        if (dataLength > paginationLimit) {
            commentComments.pop();
        }
        var getCompletePostsData = yield getPostsListCompleteData(commentComments, currentID);
        const completePostsList = getCompletePostsData.completeDataList;
        usersProfileData.push(...getCompletePostsData.usersProfileData);
        usersSocialsData.push(...getCompletePostsData.usersSocialsData);
        console.log('successfully fetching comment data');
        res.json({
            message: 'Successfully fetched data', usersProfileData: usersProfileData,
            usersSocialsData: usersSocialsData, commentsData: completePostsList,
            canPaginate: dataLength > paginationLimit, parentPostData: parentPostData,
            selectedCommentData: selectedCommentData
        });
    }
    catch (error) {
        console.error('Error fetching comment data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchSelectedCommentCommentsPagination', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sender, commentID, currentID, currentLength, paginationLimit, maxFetchLimit } = req.body;
    try {
        var commentsData = [];
        const fetchCommentCommentsQuery = `SELECT * FROM public."fetch_comment_comments"($1, $2, $3, $4, $5, $6, $7, $8)`;
        const fetchCommentComments = yield postsClient.query(fetchCommentCommentsQuery, [
            commentID, currentID, currentLength, Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1)),
            username, IP, PORT, password
        ]);
        const commentComments = fetchCommentComments.rows.map((e) => e.post_data);
        const dataLength = commentComments.length;
        if (dataLength > paginationLimit) {
            commentComments.pop();
        }
        var getCompletePostsData = yield getPostsListCompleteData(commentComments, currentID);
        const completePostsList = getCompletePostsData.completeDataList;
        const usersProfileData = getCompletePostsData.usersProfileData;
        const usersSocialsData = getCompletePostsData.usersSocialsData;
        console.log('successfully fetching comment data');
        console.log(commentsData);
        res.json({
            message: 'Successfully fetched data', usersProfileData: usersProfileData,
            usersSocialsData: usersSocialsData, commentsData: completePostsList,
            canPaginate: dataLength > paginationLimit
        });
    }
    catch (error) {
        console.error('Error fetching comment data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchSearchedPosts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { searchedText, currentID, currentLength, paginationLimit, maxFetchLimit } = req.body;
    console.log(req.body);
    try {
        const fetchSearchedPostsDataQuery = `SELECT * FROM public."fetch_searched_posts"($1, $2, $3, $4, $5, $6, $7, $8)`;
        const fetchSearchedPostsData = yield postsClient.query(fetchSearchedPostsDataQuery, [
            currentID, searchedText, currentLength, maxFetchLimit,
            username, IP, PORT, password
        ]);
        const searchedPosts = fetchSearchedPostsData.rows.map((e) => e.post_data);
        //console.log(searchedPosts);
        const totalPostsLength = Math.min(maxFetchLimit, searchedPosts.length);
        console.log(totalPostsLength);
        var modifiedSearchedPosts = [...searchedPosts];
        modifiedSearchedPosts = modifiedSearchedPosts.slice(currentLength, currentLength + Math.min(searchedPosts.length - currentLength, paginationLimit));
        var getCompletePostsData = yield getPostsListFilteredData(modifiedSearchedPosts, currentID);
        const completePostsList = getCompletePostsData.completeDataList;
        const usersProfileData = getCompletePostsData.usersProfileData;
        const usersSocialsData = getCompletePostsData.usersSocialsData;
        console.log(searchedPosts.length);
        console.log('successfully fetched searched posts');
        res.json({
            'message': "Successfully fetched data",
            'usersProfileData': usersProfileData,
            'usersSocialsData': usersSocialsData,
            'searchedPosts': searchedPosts,
            'modifiedSearchedPosts': completePostsList,
            'totalPostsLength': totalPostsLength
        });
    }
    catch (error) {
        console.error('Error fetching user data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchSearchedPostsPagination', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var { searchedText, searchedPostsEncoded, currentID, currentLength, paginationLimit } = req.body;
    try {
        var modifiedSearchedPosts = JSON.parse(searchedPostsEncoded);
        console.log(modifiedSearchedPosts.length);
        var getCompletePostsData = yield getPostsListFilteredData(modifiedSearchedPosts, currentID);
        const completePostsList = getCompletePostsData.completeDataList;
        const usersProfileData = getCompletePostsData.usersProfileData;
        const usersSocialsData = getCompletePostsData.usersSocialsData;
        console.log(completePostsList.length);
        console.log('successfully fetched searched pagination');
        res.json({
            'message': "Successfully fetched data",
            'usersProfileData': usersProfileData,
            'usersSocialsData': usersSocialsData,
            'modifiedSearchedPosts': completePostsList,
        });
    }
    catch (error) {
        console.error('Error fetching user data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchSearchedComments', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { searchedText, currentID, currentLength, paginationLimit, maxFetchLimit } = req.body;
    console.log(req.body);
    try {
        const fetchSearchedCommentsDataQuery = `SELECT * FROM public."fetch_searched_comments"($1, $2, $3, $4, $5, $6, $7, $8)`;
        const fetchSearchedCommentsData = yield postsClient.query(fetchSearchedCommentsDataQuery, [
            currentID, searchedText, currentLength, maxFetchLimit,
            username, IP, PORT, password
        ]);
        const searchedComments = fetchSearchedCommentsData.rows.map((e) => e.post_data);
        const totalCommentsLength = Math.min(maxFetchLimit, searchedComments.length);
        console.log(totalCommentsLength);
        var modifiedSearchedComments = [...searchedComments];
        modifiedSearchedComments = modifiedSearchedComments.slice(currentLength, currentLength + Math.min(searchedComments.length - currentLength, paginationLimit));
        var getCompletePostsData = yield getPostsListFilteredData(modifiedSearchedComments, currentID);
        const completePostsList = getCompletePostsData.completeDataList;
        const usersProfileData = getCompletePostsData.usersProfileData;
        const usersSocialsData = getCompletePostsData.usersSocialsData;
        console.log(searchedComments.length);
        console.log('successfully fetched searched comments');
        res.json({
            'message': "Successfully fetched data",
            'usersProfileData': usersProfileData,
            'usersSocialsData': usersSocialsData,
            'searchedComments': searchedComments,
            'modifiedSearchedComments': completePostsList,
            'totalCommentsLength': totalCommentsLength
        });
    }
    catch (error) {
        console.error('Error fetching user data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchSearchedCommentsPagination', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var { searchedText, searchedCommentsEncoded, currentID, currentLength, paginationLimit } = req.body;
    try {
        var modifiedSearchedComments = JSON.parse(searchedCommentsEncoded);
        var getCompletePostsData = yield getPostsListFilteredData(modifiedSearchedComments, currentID);
        const completePostsList = getCompletePostsData.completeDataList;
        const usersProfileData = getCompletePostsData.usersProfileData;
        const usersSocialsData = getCompletePostsData.usersSocialsData;
        console.log(modifiedSearchedComments.length);
        console.log('successfully fetched searched pagination');
        res.json({
            'message': "Successfully fetched data",
            'usersProfileData': usersProfileData,
            'usersSocialsData': usersSocialsData,
            'modifiedSearchedComments': completePostsList,
        });
    }
    catch (error) {
        console.error('Error fetching user data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchSearchedUsers', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { searchedText, currentID, currentLength, paginationLimit, maxFetchLimit } = req.body;
    console.log(req.body);
    try {
        const fetchSearchedUsersDataQuery = `SELECT user_id FROM basic_data.user_profile WHERE name LIKE '%${searchedText}%' OR username LIKE '%${searchedText}%'`;
        const fetchSearchedUsersData = yield profilesClient.query(fetchSearchedUsersDataQuery, []);
        var searchedUsersData = fetchSearchedUsersData.rows.map((e) => e.user_id);
        const totalUsersLength = searchedUsersData.length;
        searchedUsersData.sort((a, b) => a > b ? -1 : 1);
        searchedUsersData = searchedUsersData.slice(0, maxFetchLimit);
        var modifiedSearchedUsers = [...searchedUsersData];
        modifiedSearchedUsers = modifiedSearchedUsers.slice(currentLength, currentLength + Math.min(searchedUsersData.length - currentLength, paginationLimit));
        var getCompleteUsersData = yield getUsersListCompleteData(modifiedSearchedUsers, currentID);
        const usersProfileData = getCompleteUsersData.usersProfileData;
        const usersSocialsData = getCompleteUsersData.usersSocialsData;
        console.log('successfully fetched searched users');
        res.json({
            'message': "Successfully fetched data",
            'usersProfileData': usersProfileData,
            'usersSocialsData': usersSocialsData,
            'searchedUsers': searchedUsersData,
            'totalUsersLength': totalUsersLength
        });
    }
    catch (error) {
        console.error('Error fetching user data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchSearchedUsersPagination', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var { searchedText, currentID, searchedUsersEncoded, } = req.body;
    try {
        var modifiedSearchedUsers = JSON.parse(searchedUsersEncoded);
        var getCompleteUsersData = yield getUsersListCompleteData(modifiedSearchedUsers, currentID);
        const usersProfileData = getCompleteUsersData.usersProfileData;
        const usersSocialsData = getCompleteUsersData.usersSocialsData;
        console.log('successfully fetched searched paginate users');
        res.json({
            'message': "Successfully fetched data",
            'usersProfileData': usersProfileData,
            'usersSocialsData': usersSocialsData,
        });
    }
    catch (error) {
        console.error('Error fetching user data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchUserNotifications', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { currentID, currentLength, paginationLimit, maxFetchLimit } = req.body;
    try {
        const fetchUserNotificationsDataQuery = `
      SELECT * FROM public."fetch_user_notifications"($1, $2, $3, $4, $5, $6, $7)
    `;
        const fetchUserNotificationsData = yield activitiesLogsClient.query(fetchUserNotificationsDataQuery, [
            currentID, currentLength, Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1)),
            username, IP, PORT, password
        ]);
        var userNotificationsData = fetchUserNotificationsData.rows.map((e) => e.notification_data);
        const dataLength = userNotificationsData.length;
        if (dataLength > paginationLimit) {
            userNotificationsData.pop();
        }
        var updatedNotificationsDataList = [];
        for (var i = 0; i < userNotificationsData.length; i++) {
            var notificationData = userNotificationsData[i];
            var sender = notificationData.sender;
            var extraData = {
                content: '',
                medias_datas: '[]',
                sender_name: '',
                sender_profile_picture_link: '',
                parent_post_type: '',
                post_deleted: false
            };
            const fetchUserDataQuery = `SELECT * FROM basic_data.user_profile WHERE user_id = $1`;
            const fetchUserData = yield profilesClient.query(fetchUserDataQuery, [sender]);
            const userData = fetchUserData.rows[0];
            extraData.sender_name = userData.name;
            extraData.sender_profile_picture_link = userData.profile_picture_link;
            if (notificationData.type == 'upload_comment') {
                const fetchCommentDataQuery = `SELECT * FROM comments_list.comments_data WHERE sender = $1 AND comment_id = $2`;
                const fetchCommentData = yield postsClient.query(fetchCommentDataQuery, [sender, notificationData.referenced_post_id]);
                const commentData = fetchCommentData.rows[0];
                extraData.content = commentData.content;
                extraData.medias_datas = commentData.medias_datas;
                extraData.parent_post_type = commentData.parent_post_type;
                extraData.post_deleted = commentData.deleted;
            }
            else if (notificationData.type == 'tagged') {
                if (notificationData.referenced_post_type == 'post') {
                    const fetchPostDataQuery = `SELECT * FROM posts_list.posts_data WHERE sender = $1 AND post_id = $2`;
                    const fetchPostData = yield postsClient.query(fetchPostDataQuery, [sender, notificationData.referenced_post_id]);
                    const postData = fetchPostData.rows[0];
                    extraData.content = postData.content;
                    extraData.medias_datas = postData.medias_datas;
                    extraData.post_deleted = postData.deleted;
                }
                else if (notificationData.referenced_post_type == 'comment') {
                    const fetchCommentDataQuery = `SELECT * FROM comments_list.comments_data WHERE sender = $1 AND comment_id = $2`;
                    const fetchCommentData = yield postsClient.query(fetchCommentDataQuery, [sender, notificationData.referenced_post_id]);
                    const commentData = fetchCommentData.rows[0];
                    extraData.content = commentData.content;
                    extraData.medias_datas = commentData.medias_datas;
                    extraData.post_deleted = commentData.deleted;
                }
            }
            else if (notificationData.referenced_post_type == 'post') {
                const fetchPostDataQuery = `SELECT * FROM posts_list.posts_data WHERE sender = $1 AND post_id = $2`;
                const fetchPostData = yield postsClient.query(fetchPostDataQuery, [currentID, notificationData.referenced_post_id]);
                const postData = fetchPostData.rows[0];
                console.log(notificationData);
                console.log(postData);
                extraData.content = postData.content;
                extraData.medias_datas = postData.medias_datas;
                extraData.post_deleted = postData.deleted;
            }
            else if (notificationData.referenced_post_type == 'comment') {
                const fetchCommentDataQuery = `SELECT * FROM comments_list.comments_data WHERE sender = $1 AND comment_id = $2`;
                const fetchCommentData = yield postsClient.query(fetchCommentDataQuery, [currentID, notificationData.referenced_post_id]);
                const commentData = fetchCommentData.rows[0];
                extraData.content = commentData.content;
                extraData.medias_datas = commentData.medias_datas;
                extraData.post_deleted = commentData.deleted;
            }
            updatedNotificationsDataList.push(Object.assign(Object.assign({}, notificationData), extraData));
        }
        res.json({
            message: 'Successfully fetched data',
            userNotificationsData: updatedNotificationsDataList,
            canPaginate: dataLength > paginationLimit
        });
    }
    catch (error) {
        console.error('Error fetching user data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchPostLikes', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postID, currentID, currentLength, paginationLimit, maxFetchLimit } = req.body;
    try {
        const fetchPostLikesDataQuery = `SELECT * FROM public."fetch_post_likes"($1, $2, $3, $4, $5, $6, $7, $8)`;
        const fetchPostLikesData = yield postsClient.query(fetchPostLikesDataQuery, [
            postID,
            currentID,
            currentLength,
            Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1)),
            username, IP, PORT, password
        ]);
        console.log(fetchPostLikesData.rows);
        const postLikesData = fetchPostLikesData.rows.map((e) => e.user_id);
        const dataLength = postLikesData.length;
        if (dataLength > paginationLimit) {
            postLikesData.pop();
        }
        var getCompleteUsersData = yield getUsersListCompleteData(postLikesData, currentID);
        const usersProfileData = getCompleteUsersData.usersProfileData;
        const usersSocialsData = getCompleteUsersData.usersSocialsData;
        res.json({
            message: 'Successfully fetched data',
            usersProfileData: usersProfileData,
            usersSocialsData: usersSocialsData,
            canPaginate: dataLength > paginationLimit,
        });
    }
    catch (error) {
        console.error('Error fetching user data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchPostBookmarks', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postID, currentID, currentLength, paginationLimit, maxFetchLimit } = req.body;
    try {
        const fetchPostBookmarksDataQuery = `SELECT * FROM public."fetch_post_bookmarks"($1, $2, $3, $4, $5, $6, $7, $8)`;
        const fetchPostBookmarksData = yield postsClient.query(fetchPostBookmarksDataQuery, [
            postID,
            currentID,
            currentLength,
            Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1)),
            username, IP, PORT, password
        ]);
        const postBookmarksData = fetchPostBookmarksData.rows.map((e) => e.user_id);
        const dataLength = postBookmarksData.length;
        if (dataLength > paginationLimit) {
            postBookmarksData.pop();
        }
        var getCompleteUsersData = yield getUsersListCompleteData(postBookmarksData, currentID);
        const usersProfileData = getCompleteUsersData.usersProfileData;
        const usersSocialsData = getCompleteUsersData.usersSocialsData;
        res.json({
            message: 'Successfully fetched data',
            usersProfileData: usersProfileData,
            usersSocialsData: usersSocialsData,
            canPaginate: dataLength > paginationLimit,
        });
    }
    catch (error) {
        console.error('Error fetching user data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchCommentLikes', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentID, currentID, currentLength, paginationLimit, maxFetchLimit } = req.body;
    try {
        const fetchCommentLikesDataQuery = `SELECT * FROM public."fetch_comment_likes"($1, $2, $3, $4, $5, $6, $7, $8)`;
        const fetchCommentLikesData = yield postsClient.query(fetchCommentLikesDataQuery, [
            commentID,
            currentID,
            currentLength,
            Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1)),
            username, IP, PORT, password
        ]);
        const commentLikesData = fetchCommentLikesData.rows.map((e) => e.user_id);
        const dataLength = commentLikesData.length;
        if (dataLength > paginationLimit) {
            commentLikesData.pop();
        }
        var getCompleteUsersData = yield getUsersListCompleteData(commentLikesData, currentID);
        const usersProfileData = getCompleteUsersData.usersProfileData;
        const usersSocialsData = getCompleteUsersData.usersSocialsData;
        res.json({
            message: 'Successfully fetched data',
            usersProfileData: usersProfileData,
            usersSocialsData: usersSocialsData,
            canPaginate: dataLength > paginationLimit,
        });
    }
    catch (error) {
        console.error('Error fetching user data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchCommentBookmarks', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentID, currentID, currentLength, paginationLimit, maxFetchLimit } = req.body;
    try {
        const fetchCommentBookmarksDataQuery = `SELECT * FROM public."fetch_comment_bookmarks"($1, $2, $3, $4, $5, $6, $7, $8)`;
        const fetchCommentBookmarksData = yield postsClient.query(fetchCommentBookmarksDataQuery, [
            commentID,
            currentID,
            currentLength,
            Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1)),
            username, IP, PORT, password
        ]);
        const commentBookmarksData = fetchCommentBookmarksData.rows.map((e) => e.user_id);
        const dataLength = commentBookmarksData.length;
        if (dataLength > paginationLimit) {
            commentBookmarksData.pop();
        }
        var getCompleteUsersData = yield getUsersListCompleteData(commentBookmarksData, currentID);
        const usersProfileData = getCompleteUsersData.usersProfileData;
        const usersSocialsData = getCompleteUsersData.usersSocialsData;
        res.json({
            message: 'Successfully fetched data',
            usersProfileData: usersProfileData,
            usersSocialsData: usersSocialsData,
            canPaginate: dataLength > paginationLimit,
        });
    }
    catch (error) {
        console.error('Error fetching user data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchSearchedTagUsers', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { searchedText, currentID, currentLength, paginationLimit } = req.body;
    console.log(req.body);
    try {
        const fetchSearchedUsersDataQuery = `SELECT user_id FROM public."fetch_searched_tag_users" ($1, $2, $3, $4)`;
        const fetchSearchedUsersData = yield profilesClient.query(fetchSearchedUsersDataQuery, [
            searchedText, currentID, currentLength, paginationLimit
        ]);
        var searchedUsersData = fetchSearchedUsersData.rows.map((e) => e.user_id);
        var getCompleteUsersData = yield getUsersListBasicData(searchedUsersData, currentID);
        const usersProfileData = getCompleteUsersData.usersProfileData.map((e) => e.data.basic_data);
        console.log('successfully fetched searched users');
        res.json({
            'message': "Successfully fetched data",
            'usersProfileData': usersProfileData,
        });
    }
    catch (error) {
        console.error('Error fetching user data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchTopHashtags', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { paginationLimit } = req.body;
    console.log(req.body);
    try {
        const fetchHashtagsDataQuery = `SELECT * FROM hashtags.hashtags_list ORDER BY hashtag_count DESC OFFSET $1 LIMIT $2`;
        const fetchHashtagsData = yield keywordsClient.query(fetchHashtagsDataQuery, [0, paginationLimit]);
        const hashtagsData = fetchHashtagsData.rows;
        res.json({
            'message': "Successfully fetched hashtags data",
            'hashtagsData': hashtagsData
        });
    }
    catch (error) {
        console.error('Error fetching hashtags data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/muteUser', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userID, currentID, } = req.body;
    try {
        const insertUpdateMutedUserSocialsQuery = `
      INSERT INTO muted_users.mute_history (user_id, muted_id)
      VALUES ($1, $2)
    `;
        try {
            if (yield userExists(userID)) {
                yield profilesClient.query('BEGIN');
                yield profilesClient.query(insertUpdateMutedUserSocialsQuery, [
                    currentID,
                    userID
                ]);
                yield profilesClient.query('COMMIT');
                console.log('successfully muted');
                res.json({ message: 'Successfully muted user' });
            }
            else {
                res.json({ message: 'User doesnt exist' });
            }
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield profilesClient.query('ROLLBACK');
            console.error('Error muted user:', error);
            // Send an error response to the profilesClient
            res.json({ message: 'Server error' });
        }
    }
    catch (error) {
        console.error('Error muted user:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/unmuteUser', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userID, currentID } = req.body;
    try {
        const insertUpdateMutedUserSocialsQuery = `DELETE FROM muted_users.mute_history WHERE user_id = $1 AND muted_id = $2;`;
        try {
            if (yield userExists(userID)) {
                yield profilesClient.query('BEGIN');
                yield profilesClient.query(insertUpdateMutedUserSocialsQuery, [
                    currentID,
                    userID
                ]);
                yield profilesClient.query('COMMIT');
                console.log('successfully unmuted');
                res.json({ message: 'Successfully unmuted user' });
            }
            else {
                res.json({ message: 'User doesnt exist' });
            }
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield profilesClient.query('ROLLBACK');
            console.error('Error unmuting user:', error);
            // Send an error response to the profilesClient
            res.json({ message: 'Server error' });
        }
    }
    catch (error) {
        console.error('Error unmuting user:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/blockUser', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userID, currentID, } = req.body;
    try {
        const insertUpdateBlockedUserSocialsQuery = `
      INSERT INTO blocked_users.block_history (user_id, blocked_id)
      VALUES ($1, $2)
    `;
        const deleteSocialsHistory = `DELETE FROM follow_users.follow_history WHERE following_id = $1 AND followed_id = $2;`;
        const deleteFollowRequestsHistory = `DELETE FROM follow_requests_users.follow_request_history WHERE requesting_id = $1 AND requested_id = $2;`;
        try {
            if (yield userExists(userID)) {
                yield profilesClient.query('BEGIN');
                yield profilesClient.query(insertUpdateBlockedUserSocialsQuery, [currentID, userID]);
                yield profilesClient.query(deleteSocialsHistory, [currentID, userID]);
                yield profilesClient.query(deleteSocialsHistory, [userID, currentID]);
                yield profilesClient.query(deleteFollowRequestsHistory, [currentID, userID]);
                yield profilesClient.query(deleteFollowRequestsHistory, [userID, currentID]);
                yield profilesClient.query('COMMIT');
                console.log('successfully blocked');
                res.json({ message: 'Successfully blocked user' });
            }
            else {
                res.json({ message: 'User doenst exist' });
            }
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield profilesClient.query('ROLLBACK');
            console.error('Error blocked user:', error);
            // Send an error response to the profilesClient
            res.json({ message: 'Server error' });
        }
    }
    catch (error) {
        console.error('Error blocked user:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/unblockUser', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userID, currentID } = req.body;
    try {
        const insertUpdateBlockedUserSocialsQuery = `DELETE FROM blocked_users.block_history WHERE user_id = $1 AND blocked_id = $2;`;
        try {
            if (yield userExists(userID)) {
                yield profilesClient.query('BEGIN');
                yield profilesClient.query(insertUpdateBlockedUserSocialsQuery, [
                    currentID,
                    userID
                ]);
                yield profilesClient.query('COMMIT');
                console.log('successfully unblocked');
                res.json({ message: 'Successfully unblocked user' });
            }
            else {
                res.json({ message: 'User doesnt exist' });
            }
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield profilesClient.query('ROLLBACK');
            console.error('Error unblocking user:', error);
            // Send an error response to the profilesClient
            res.json({ message: 'Server error' });
        }
    }
    catch (error) {
        console.error('Error unblocking user:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/lockAccount', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { currentID } = req.body;
    try {
        const insertUserPrivateQuery = `
      UPDATE basic_data.user_profile
      SET private = $2
      WHERE user_id = $1
    `;
        try {
            yield profilesClient.query('BEGIN');
            yield profilesClient.query(insertUserPrivateQuery, [
                currentID, true
            ]);
            yield profilesClient.query('COMMIT');
            console.log('successfully locked');
            res.json({ message: 'Successfully locked user' });
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield profilesClient.query('ROLLBACK');
            console.error('Error locking user:', error);
            // Send an error response to the profilesClient
            res.json({ message: 'Server error' });
        }
    }
    catch (error) {
        console.error('Error locking user:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/unlockAccount', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { currentID } = req.body;
    console.log(req.body);
    try {
        const insertUserPrivateQuery = `
      UPDATE basic_data.user_profile
      SET private = $2
      WHERE user_id = $1
    `;
        const fetchAllRequestsToCurrentIDQuery = `SELECT requesting_id FROM follow_requests_users.follow_request_history WHERE requested_id = $1`;
        const removeAllRequestsToCurrentIDQuery = `DELETE FROM follow_requests_users.follow_request_history WHERE requested_id = $1`;
        try {
            const fetchAllRequestsToCurrentID = yield profilesClient.query(fetchAllRequestsToCurrentIDQuery, [
                currentID
            ]);
            const allRequestsToCurrentID = fetchAllRequestsToCurrentID.rows.map((e) => e.requesting_id);
            yield profilesClient.query('BEGIN');
            yield profilesClient.query(insertUserPrivateQuery, [
                currentID, false
            ]);
            yield profilesClient.query(removeAllRequestsToCurrentIDQuery, [
                currentID
            ]);
            for (var i = 0; i < allRequestsToCurrentID.length; i++) {
                var userID = allRequestsToCurrentID[i];
                console.log(userID);
                const removeCurrentIDFromRequestFromQuery = `DELETE FROM follow_requests_users.follow_request_history WHERE requesting_id = $1 AND requested_id = $2`;
                yield profilesClient.query(removeCurrentIDFromRequestFromQuery, [userID, currentID]);
                followUser(currentID, userID, false);
            }
            yield profilesClient.query('COMMIT');
            console.log('successfully unlocked');
            res.json({ message: 'Successfully unlocked user' });
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield profilesClient.query('ROLLBACK');
            console.error('Error unlocking user:', error);
            // Send an error response to the profilesClient
            res.json({ message: 'Server error' });
        }
    }
    catch (error) {
        console.error('Error unlocking user:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/cancelFollowRequest', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userID, currentID, } = req.body;
    try {
        const deleteFollowRequestQuery = `DELETE FROM follow_requests_users.follow_request_history WHERE requesting_id = $1 AND requested_id = $2;`;
        try {
            if (yield userExists(userID)) {
                yield profilesClient.query('BEGIN');
                yield profilesClient.query(deleteFollowRequestQuery, [
                    currentID, userID
                ]);
                yield profilesClient.query('COMMIT');
                console.log('successfully cancelled');
                res.json({ message: 'Successfully cancelled user' });
            }
            else {
                res.json({ message: 'User doesnt exist' });
            }
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield profilesClient.query('ROLLBACK');
            console.error('Error cancelled user:', error);
            // Send an error response to the profilesClient
            res.json({ message: 'Server error' });
        }
    }
    catch (error) {
        console.error('Error cancelled user:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/rejectFollowRequest', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userID, currentID, } = req.body;
    try {
        const deleteFollowRequestQuery = `DELETE FROM follow_requests_users.follow_request_history WHERE requesting_id = $1 AND requested_id = $2;`;
        try {
            if (yield userExists(userID)) {
                yield profilesClient.query('BEGIN');
                yield profilesClient.query(deleteFollowRequestQuery, [
                    userID, currentID
                ]);
                yield profilesClient.query('COMMIT');
                console.log('successfully rejectled');
                res.json({ message: 'Successfully rejectled user' });
            }
            else {
                res.json({ message: 'User doesnt exist' });
            }
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield profilesClient.query('ROLLBACK');
            console.error('Error rejectled user:', error);
            // Send an error response to the profilesClient
            res.json({ message: 'Server error' });
        }
    }
    catch (error) {
        console.error('Error rejectled user:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/acceptFollowRequest', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userID, currentID, } = req.body;
    try {
        const deleteFollowRequestQuery = `DELETE FROM follow_requests_users.follow_request_history WHERE requesting_id = $1 AND requested_id = $2;`;
        try {
            if (yield userExists(userID)) {
                yield profilesClient.query('BEGIN');
                yield profilesClient.query(deleteFollowRequestQuery, [
                    userID, currentID
                ]);
                followUser(currentID, userID, false);
                yield profilesClient.query('COMMIT');
                console.log('successfully accepted');
                res.json({ message: 'Successfully accepted user' });
            }
            else {
                res.json({ message: 'User doesnt exist' });
            }
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield profilesClient.query('ROLLBACK');
            console.error('Error accepted user:', error);
            // Send an error response to the profilesClient
            res.json({ message: 'Server error' });
        }
    }
    catch (error) {
        console.error('Error accepted user:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchFollowRequestsFromUser', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { currentID, currentLength, paginationLimit, maxFetchLimit } = req.body;
    console.log(req.body);
    try {
        const fetchUserProfileFollowRequestsFromQuery = `SELECT * FROM public."fetch_follow_requests_from"($1, $2, $3)`;
        const fetchUserProfileFollowRequestsFrom = yield profilesClient.query(fetchUserProfileFollowRequestsFromQuery, [
            currentID,
            currentLength,
            Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1))
        ]);
        const userProfileFollowRequestsFrom = fetchUserProfileFollowRequestsFrom.rows.map((e) => e.user_id);
        const dataLength = userProfileFollowRequestsFrom.length;
        if (dataLength > paginationLimit) {
            userProfileFollowRequestsFrom.pop();
        }
        var usersProfileData = [];
        var usersSocialsData = [];
        for (var i = 0; i < userProfileFollowRequestsFrom.length; i++) {
            var userID = userProfileFollowRequestsFrom[i];
            var userProfileData = yield getRequesterProfileData(userID, currentID, RequestType.From);
            usersProfileData.push(userProfileData.data.basic_data);
            usersSocialsData.push(userProfileData.data.socials_data);
        }
        res.json({
            message: "Successfully fetched data", usersProfileData: usersProfileData,
            usersSocialsData: usersSocialsData, canPaginate: dataLength > paginationLimit,
        });
    }
    catch (error) {
        console.error('Error during fetching follow requests from user:', error);
        res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchFollowRequestsToUser', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { currentID, currentLength, paginationLimit, maxFetchLimit } = req.body;
    console.log(req.body);
    try {
        const fetchUserProfilefollowRequestsToQuery = `SELECT * FROM public."fetch_follow_requests_to"($1, $2, $3)`;
        const fetchUserProfilefollowRequestsTo = yield profilesClient.query(fetchUserProfilefollowRequestsToQuery, [
            currentID,
            currentLength,
            Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1))
        ]);
        const userProfileFollowRequestsTo = fetchUserProfilefollowRequestsTo.rows.map((e) => e.user_id);
        const dataLength = userProfileFollowRequestsTo.length;
        if (dataLength > paginationLimit) {
            userProfileFollowRequestsTo.pop();
        }
        var usersProfileData = [];
        var usersSocialsData = [];
        for (var i = 0; i < userProfileFollowRequestsTo.length; i++) {
            var userID = userProfileFollowRequestsTo[i];
            var userProfileData = yield getRequesterProfileData(userID, currentID, RequestType.To);
            usersProfileData.push(userProfileData.data.basic_data);
            usersSocialsData.push(userProfileData.data.socials_data);
        }
        res.json({
            message: "Successfully fetched data", usersProfileData: usersProfileData,
            usersSocialsData: usersSocialsData, canPaginate: dataLength > paginationLimit,
        });
    }
    catch (error) {
        console.error('Error during fetching follow requests to user:', error);
        res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchUserChats', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userID, currentLength, paginationLimit, maxFetchLimit } = req.body;
    const fetchUserChatsDataQuery = `
    SELECT * FROM public."fetch_user_chats" ($1, $2, $3, $4, $5, $6, $7)
  `;
    const fetchUserChatsData = yield chatsClient.query(fetchUserChatsDataQuery, [
        userID,
        currentLength,
        Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1)),
        username, IP, PORT, password
    ]);
    const chatsData = fetchUserChatsData.rows.map((e) => e.chat_data);
    const dataLength = chatsData.length;
    if (dataLength > paginationLimit) {
        chatsData.pop();
    }
    var recipientsProfileData = [];
    var recipientsSocialsData = [];
    var recipientsID = [];
    if (chatsData.length > 0) {
        var currentCompleteData = yield getCompleteUserProfileData(userID, userID);
        recipientsProfileData.push(currentCompleteData.data.basic_data);
        recipientsSocialsData.push(currentCompleteData.data.socials_data);
        recipientsID.push(userID);
    }
    for (var i = 0; i < chatsData.length; i++) {
        var chatID = chatsData[i].chat_id;
        var type = chatsData[i].type;
        if (type == 'private') {
            var recipient = chatsData[i].recipient;
            if (!recipientsID.includes(recipient)) {
                var recipientCompleteData = yield getCompleteUserProfileData(recipient, userID);
                ;
                recipientsProfileData.push(recipientCompleteData.data.basic_data);
                recipientsSocialsData.push(recipientCompleteData.data.socials_data);
                recipientsID.push(recipient);
            }
            const fetchLatestMessageDataQuery = `
        SELECT * FROM private_messages.messages_history
        WHERE chat_id = $1 AND NOT $2 = ANY(deleted_list)
        ORDER BY upload_time DESC
        LIMIT 1
      `;
            const fetchLatestMessageData = yield chatsClient.query(fetchLatestMessageDataQuery, [chatID, userID]);
            console.log(fetchLatestMessageData.rows);
            if (fetchLatestMessageData.rowCount > 0) {
                const latestMessageData = fetchLatestMessageData.rows[0];
                chatsData[i].latest_message_upload_time = latestMessageData.upload_time;
                chatsData[i].latest_message_id = latestMessageData.message_id;
                chatsData[i].latest_message_content = latestMessageData.content;
                chatsData[i].latest_message_type = latestMessageData.type;
                chatsData[i].latest_message_sender = latestMessageData.sender;
            }
            else {
                chatsData[i].latest_message_content = '';
                chatsData[i].latest_message_upload_time = '';
                chatsData[i].latest_message_id = '';
                chatsData[i].latest_message_type = '';
                chatsData[i].latest_message_sender = '';
            }
        }
        else if (type == 'group') {
            const fetchLatestMessageDataQuery = `
        SELECT * FROM group_messages.messages_history
        WHERE chat_id = $1 AND NOT $2 = ANY(deleted_list)
        ORDER BY upload_time DESC
        LIMIT 1
      `;
            const fetchLatestMessageData = yield chatsClient.query(fetchLatestMessageDataQuery, [chatID, userID]);
            if (fetchLatestMessageData.rowCount > 0) {
                const latestMessageData = fetchLatestMessageData.rows[0];
                console.log(latestMessageData);
                chatsData[i].latest_message_upload_time = latestMessageData.upload_time;
                chatsData[i].latest_message_id = latestMessageData.message_id;
                chatsData[i].latest_message_content = latestMessageData.content;
                chatsData[i].latest_message_type = latestMessageData.type;
                chatsData[i].latest_message_sender = latestMessageData.sender;
                var senderID = latestMessageData.sender;
                if (!recipientsID.includes(senderID)) {
                    var userCompleteData = yield getCompleteUserProfileData(senderID, userID);
                    recipientsProfileData.push(userCompleteData.data.basic_data);
                    recipientsSocialsData.push(userCompleteData.data.socials_data);
                    recipientsID.push(senderID);
                }
                if (latestMessageData.type.includes('add_users_to_group')) {
                    var addedUserID = latestMessageData.type.replace('add_users_to_group_', '');
                    if (!recipientsID.includes(addedUserID)) {
                        var userCompleteData = yield getCompleteUserProfileData(addedUserID, userID);
                        recipientsProfileData.push(userCompleteData.data.basic_data);
                        recipientsSocialsData.push(userCompleteData.data.socials_data);
                        recipientsID.push(addedUserID);
                    }
                }
            }
            else {
                chatsData[i].latest_message_content = '';
                chatsData[i].latest_message_upload_time = '';
                chatsData[i].latest_message_id = '';
                chatsData[i].latest_message_type = '';
                chatsData[i].latest_message_sender = '';
            }
            const fetchGroupProfileDataQuery = `
        SELECT * FROM group_profile.group_info 
        WHERE chat_id = $1
      `;
            const fetchGroupProfileData = yield chatsClient.query(fetchGroupProfileDataQuery, [chatID]);
            const groupProfileData = fetchGroupProfileData.rows[0];
            chatsData[i].group_profile_data = groupProfileData;
            chatsData[i].members = groupProfileData.members;
        }
    }
    console.log(chatsData);
    res.json({
        message: 'Successfully fetched data',
        userChatsData: chatsData,
        recipientsProfileData: recipientsProfileData,
        recipientsSocialsData: recipientsSocialsData,
        canPaginate: dataLength > paginationLimit
    });
}));
usersRoutes.get('/fetchPrivateChat', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var { chatID, currentID, recipient, currentLength, paginationLimit, maxFetchLimit } = req.body;
    var privateChatData = null;
    try {
        if ((yield userExists(recipient)) && !(yield isBlockedByUser(currentID, recipient)) && !(yield isBlockedByUser(recipient, currentID))) {
            var currentCompleteData = yield getCompleteUserProfileData(currentID, currentID);
            var recipientCompleteData = yield getCompleteUserProfileData(recipient, currentID);
            var membersProfileData = [
                currentCompleteData.data.basic_data, recipientCompleteData.data.basic_data
            ];
            var membersSocialsData = [
                currentCompleteData.data.socials_data, recipientCompleteData.data.socials_data
            ];
            if (chatID == null) {
                console.log('chat id null');
                const fetchChatDataQuery = `
          SELECT * FROM users_chats.chats_history
          WHERE user_id = $1 AND recipient = $2
        `;
                const fetchChatData = yield chatsClient.query(fetchChatDataQuery, [
                    currentID, recipient
                ]);
                const chatData = fetchChatData.rows[0];
                console.log(fetchChatData);
                if (chatData == undefined) {
                    res.json({
                        'message': 'Chat history not found',
                        'chatID': null,
                        'messagesData': [],
                        'membersProfileData': membersProfileData,
                        'membersSocialsData': membersSocialsData,
                        'canPaginate': false
                    });
                }
                else {
                    chatID = chatData.chat_id;
                }
            }
            if (chatID != null || chatID != undefined) {
                console.log('chat id not null $chatID');
                const fetchPrivateChatDataQuery = `
          SELECT * FROM private_messages.messages_history
          WHERE chat_id = $1 AND NOT $2 = ANY(deleted_list)
          ORDER BY upload_time DESC
          OFFSET $3 LIMIT $4
        `;
                const fetchPrivateChatData = yield chatsClient.query(fetchPrivateChatDataQuery, [
                    chatID,
                    currentID,
                    currentLength,
                    Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1))
                ]);
                privateChatData = fetchPrivateChatData.rows;
                const dataLength = privateChatData.length;
                if (dataLength > paginationLimit) {
                    privateChatData.pop();
                }
                res.json({
                    'message': 'Chat history found',
                    'messagesData': privateChatData,
                    'chatID': chatID,
                    'membersProfileData': membersProfileData,
                    'membersSocialsData': membersSocialsData,
                    'canPaginate': dataLength > paginationLimit
                });
            }
        }
        else {
            res.json({
                'message': 'blacklisted'
            });
        }
    }
    catch (error) {
        console.error('Internal error inserting chat data:', error);
        yield chatsClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchPrivateChatPagination', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var { chatID, currentID, recipient, currentLength, paginationLimit, maxFetchLimit } = req.body;
    var privateChatData = null;
    try {
        if ((yield userExists(recipient)) && !(yield isBlockedByUser(currentID, recipient)) && !(yield isBlockedByUser(recipient, currentID))) {
            const fetchPrivateChatDataQuery = `
        SELECT * FROM private_messages.messages_history
        WHERE chat_id = $1 AND NOT $2 = ANY(deleted_list)
        ORDER BY upload_time DESC
        OFFSET $3 LIMIT $4
      `;
            const fetchPrivateChatData = yield chatsClient.query(fetchPrivateChatDataQuery, [
                chatID,
                currentID,
                currentLength,
                Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1))
            ]);
            privateChatData = fetchPrivateChatData.rows;
            const dataLength = privateChatData.length;
            if (dataLength > paginationLimit) {
                privateChatData.pop();
            }
            res.json({
                'message': 'Chat history found',
                'messagesData': privateChatData,
                'chatID': chatID,
                'membersProfileData': [],
                'membersSocialsData': [],
                'canPaginate': dataLength > paginationLimit
            });
        }
        else {
            res.json({
                'message': 'blacklisted'
            });
        }
    }
    catch (error) {
        console.error('Internal error inserting chat data:', error);
        yield chatsClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.post('/sendPrivateMessage', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chatID, newChatID, messageID, content, sender, recipient, mediasDatas, } = req.body;
    try {
        console.log(req.body);
        if ((yield userExists(recipient)) && !(yield isBlockedByUser(sender, recipient)) && !(yield isBlockedByUser(recipient, sender))) {
            if (chatID == null) {
                const insertCurrentUserChatTableQuery = `
          INSERT INTO users_chats.chats_history(
            user_id, chat_id, type, recipient, deleted
          )
          VALUES ($1, $2, $3, $4, $5)
        `;
                yield chatsClient.query(insertCurrentUserChatTableQuery, [sender, newChatID, 'private', recipient, false]);
                const insertRecipientUserChatTableQuery = `
          INSERT INTO users_chats.chats_history(
            user_id, chat_id, type, recipient, deleted
          )
          VALUES ($1, $2, $3, $4, $5)
        `;
                yield chatsClient.query(insertRecipientUserChatTableQuery, [recipient, newChatID, 'private', sender, false]);
                const insertCurrentUserChatQuery = `
          INSERT INTO private_messages.messages_history(
            chat_id, message_id, type, content, sender, upload_time, medias_datas, deleted_list
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
                yield chatsClient.query(insertCurrentUserChatQuery, [
                    newChatID, messageID, 'message', content, sender, new Date().toISOString(), JSON.stringify(mediasDatas),
                    []
                ]);
            }
            else {
                const insertCurrentUserChatQuery = `
          INSERT INTO private_messages.messages_history(
            chat_id, message_id, type, content, sender, upload_time, medias_datas, deleted_list
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
                yield chatsClient.query(insertCurrentUserChatQuery, [
                    chatID, messageID, 'message', content, sender, new Date().toISOString(),
                    JSON.stringify(mediasDatas), []
                ]);
                const updateCurrentUserChatTableQuery = `
          UPDATE users_chats.chats_history
          SET deleted = $1
          WHERE user_id = $2 AND chat_id = $3
        `;
                yield chatsClient.query(updateCurrentUserChatTableQuery, [false, sender, chatID]);
                const updateRecipientUserChatTableQuery = `
          UPDATE users_chats.chats_history
          SET deleted = $1
          WHERE user_id = $2 AND chat_id = $3
        `;
                yield chatsClient.query(updateRecipientUserChatTableQuery, [false, recipient, chatID]);
            }
            res.json({
                'message': 'Successfully sent message'
            });
        }
        else {
            res.json({
                'message': 'Failed to message'
            });
        }
    }
    catch (error) {
        console.error('Internal error inserting chat data:', error);
        yield chatsClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/deletePrivateChat', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chatID, currentID, } = req.body;
    try {
        const deleteAllMessagesQuery = `
      UPDATE private_messages.messages_history
      SET deleted_list = array_append(deleted_list, $1)
      WHERE chat_id = $2
    `;
        yield chatsClient.query(deleteAllMessagesQuery, [currentID, chatID]);
        const deletePrivateChatQuery = `
      UPDATE users_chats.chats_history
      SET deleted = $1
      WHERE user_id = $2 AND chat_id = $3
    `;
        yield chatsClient.query(deletePrivateChatQuery, [
            true, currentID, chatID
        ]);
        res.json({
            'message': 'Successfully deleted private chat'
        });
    }
    catch (error) {
        console.error('Internal error:', error);
        yield chatsClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/deletePrivateMessage', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chatID, messageID, currentID } = req.body;
    try {
        const deleteMessageQuery = `
      UPDATE private_messages.messages_history
      SET deleted_list = array_append(deleted_list, $1)
      WHERE message_id = $2
    `;
        yield chatsClient.query(deleteMessageQuery, [currentID, messageID]);
        res.json({
            'message': 'Successfully deleted private message'
        });
    }
    catch (error) {
        console.error('Internal error:', error);
        yield chatsClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/deletePrivateMessageForAll', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chatID, messageID, currentID, recipient } = req.body;
    try {
        var members = [currentID, recipient];
        const deleteMessageQuery = `
      UPDATE private_messages.messages_history
      SET deleted_list = array_cat(deleted_list, $1)
      WHERE message_id = $2
    `;
        yield chatsClient.query(deleteMessageQuery, [members, messageID]);
        res.json({
            'message': 'Successfully deleted private message'
        });
    }
    catch (error) {
        console.error('Internal error:', error);
        yield chatsClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchSearchedChatUsers', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { searchedText, currentID, currentLength, paginationLimit } = req.body;
    console.log(req.body);
    try {
        const fetchSearchedUsersDataQuery = `SELECT user_id FROM public."fetch_searched_chat_users" ($1, $2, $3, $4)`;
        const fetchSearchedUsersData = yield profilesClient.query(fetchSearchedUsersDataQuery, [
            searchedText, currentID, currentLength, paginationLimit
        ]);
        var searchedUsersData = fetchSearchedUsersData.rows.map((e) => e.user_id);
        console.log(searchedUsersData);
        var getCompleteUsersData = yield getUsersListBasicData(searchedUsersData, currentID);
        const usersProfileData = getCompleteUsersData.usersProfileData.map((e) => e.data.basic_data);
        console.log(usersProfileData);
        console.log('successfully fetched searched users');
        res.json({
            'message': "Successfully fetched data",
            'usersProfileData': usersProfileData,
        });
    }
    catch (error) {
        console.error('Error fetching user data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchGroupChat', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var { chatID, currentID, currentLength, paginationLimit, maxFetchLimit } = req.body;
    try {
        console.log('chat id not null $chatID');
        var membersProfileData = [];
        var membersSocialsData = [];
        var membersIDs = [];
        const fetchGroupProfileDataQuery = `
      SELECT * FROM group_profile.group_info
      WHERE chat_id = $1
    `;
        const fetchGroupProfileData = yield chatsClient.query(fetchGroupProfileDataQuery, [
            chatID
        ]);
        var groupProfileData = fetchGroupProfileData.rows[0];
        const fetchGroupChatDataQuery = `
      SELECT * FROM group_messages.messages_history
      WHERE chat_id = $1 AND NOT $2 = ANY(deleted_list)
      ORDER BY upload_time DESC
      OFFSET $3 LIMIT $4
    `;
        const fetchGroupChatData = yield chatsClient.query(fetchGroupChatDataQuery, [
            chatID,
            currentID,
            currentLength,
            Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1))
        ]);
        var groupChatData = fetchGroupChatData.rows;
        const dataLength = groupChatData.length;
        if (dataLength > paginationLimit) {
            groupChatData.pop();
        }
        for (var i = 0; i < groupChatData.length; i++) {
            var recipient = groupChatData[i].sender;
            if (!membersIDs.includes(recipient)) {
                membersIDs.push(recipient);
                var recipientCompleteData = yield getCompleteUserProfileData(recipient, currentID);
                membersProfileData.push(recipientCompleteData.data.basic_data);
                membersSocialsData.push(recipientCompleteData.data.socials_data);
            }
            if (groupChatData[i].type.includes('add_users_to_group')) {
                var addedUserID = groupChatData[i].type.replace('add_users_to_group_', '');
                if (!membersIDs.includes(addedUserID)) {
                    var userCompleteData = yield getCompleteUserProfileData(addedUserID, currentID);
                    membersProfileData.push(userCompleteData.data.basic_data);
                    membersSocialsData.push(userCompleteData.data.socials_data);
                    membersIDs.push(addedUserID);
                }
            }
        }
        const fetchGroupChatMembersQuery = `
      SELECT members FROM group_profile.group_info 
      WHERE chat_id = $1
    `;
        const fetchGroupChatMembers = yield chatsClient.query(fetchGroupChatMembersQuery, [chatID]);
        var groupChatMembersID = fetchGroupChatMembers.rows[0].members;
        res.json({
            'message': 'Chat history found',
            'messagesData': groupChatData,
            'chatID': chatID,
            'groupMembersID': groupChatMembersID,
            'groupProfileData': groupProfileData,
            'membersProfileData': membersProfileData,
            'membersSocialsData': membersSocialsData,
            'canPaginate': dataLength > paginationLimit
        });
    }
    catch (error) {
        console.error('Internal error inserting chat data:', error);
        yield chatsClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchGroupChatPagination', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var { chatID, currentID, currentLength, paginationLimit, maxFetchLimit } = req.body;
    try {
        console.log('chat id not null $chatID');
        var membersProfileData = [];
        var membersSocialsData = [];
        var membersIDs = [];
        const fetchGroupChatDataQuery = `
      SELECT * FROM group_messages.messages_history
      WHERE chat_id = $1 AND NOT $2 = ANY(deleted_list)
      ORDER BY upload_time DESC
      OFFSET $3 LIMIT $4
    `;
        const fetchGroupChatData = yield chatsClient.query(fetchGroupChatDataQuery, [
            chatID,
            currentID,
            currentLength,
            Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1))
        ]);
        var groupChatData = fetchGroupChatData.rows;
        const dataLength = groupChatData.length;
        if (dataLength > paginationLimit) {
            groupChatData.pop();
        }
        for (var i = 0; i < groupChatData.length; i++) {
            var recipient = groupChatData[i].sender;
            if (!membersIDs.includes(recipient)) {
                membersIDs.push(recipient);
                var recipientCompleteData = yield getCompleteUserProfileData(recipient, currentID);
                membersProfileData.push(recipientCompleteData.data.basic_data);
                membersSocialsData.push(recipientCompleteData.data.socials_data);
            }
            if (groupChatData[i].type.includes('add_users_to_group')) {
                var addedUserID = groupChatData[i].type.replace('add_users_to_group_', '');
                if (!membersIDs.includes(addedUserID)) {
                    var userCompleteData = yield getCompleteUserProfileData(addedUserID, currentID);
                    membersProfileData.push(userCompleteData.data.basic_data);
                    membersSocialsData.push(userCompleteData.data.socials_data);
                    membersIDs.push(addedUserID);
                }
            }
        }
        res.json({
            'message': 'Chat history found',
            'messagesData': groupChatData,
            'chatID': chatID,
            'membersProfileData': membersProfileData,
            'membersSocialsData': membersSocialsData,
            'canPaginate': dataLength > paginationLimit
        });
    }
    catch (error) {
        console.error('Internal error inserting chat data:', error);
        yield chatsClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.post('/sendGroupMessage', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var { chatID, newChatID, messageID, content, sender, recipients, mediasDatas, } = req.body;
    try {
        if (chatID == null) {
            const insertCurrentUserChatQuery = `
        INSERT INTO group_messages.messages_history(
          chat_id, message_id, type, content, sender, upload_time, medias_datas, deleted_list
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
            yield chatsClient.query(insertCurrentUserChatQuery, [
                newChatID, messageID, 'message', content, sender, new Date().toISOString(), JSON.stringify(mediasDatas),
                []
            ]);
            const insertGroupProfileQuery = `
        INSERT INTO group_profile.group_info(
          chat_id, name, profile_pic_link, description, members
        )
        VALUES ($1, $2, $3, $4, $5)
      `;
            yield chatsClient.query(insertGroupProfileQuery, [
                newChatID,
                `Group ${newChatID}`,
                'https://as2.ftcdn.net/v2/jpg/03/13/82/51/1000_F_313825184_EpuEFYiODvG1lvqfKN2uIVAceAV5T0OX.jpg',
                '', recipients
            ]);
            for (var i = 0; i < recipients.length; i++) {
                var recipient = recipients[i];
                const insertRecipientUserChatTableQuery = `
          INSERT INTO users_chats.chats_history(
            user_id, chat_id, type, recipient, deleted
          )
          VALUES ($1, $2, $3, $4, $5)
        `;
                yield chatsClient.query(insertRecipientUserChatTableQuery, [recipient, newChatID, 'group', '', false]);
            }
        }
        else {
            const insertCurrentUserChatQuery = `
        INSERT INTO group_messages.messages_history(
          chat_id, message_id, type, content, sender, upload_time, medias_datas, deleted_list
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
            yield chatsClient.query(insertCurrentUserChatQuery, [
                chatID, messageID, 'message', content, sender, new Date().toISOString(),
                JSON.stringify(mediasDatas), []
            ]);
            for (var i = 0; i < recipients.length; i++) {
                var recipient = recipients[i];
                const updateRecipientUserChatTableQuery = `
          UPDATE users_chats.chats_history
          SET deleted = $1
          WHERE user_id = $2 AND chat_id = $3
        `;
                yield chatsClient.query(updateRecipientUserChatTableQuery, [false, recipient, chatID]);
            }
        }
        res.json({
            'message': 'Successfully sent message'
        });
    }
    catch (error) {
        console.error('Internal error inserting chat data:', error);
        yield chatsClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/deleteGroupChat', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chatID, currentID, } = req.body;
    try {
        const deleteAllMessagesQuery = `
      UPDATE group_messages.messages_history
      SET deleted_list = array_append(deleted_list, $1)
      WHERE chat_id = $2
    `;
        yield chatsClient.query(deleteAllMessagesQuery, [currentID, chatID]);
        const deleteGroupChatQuery = `
      UPDATE users_chats.chats_history
      SET deleted = $1
      WHERE user_id = $2 AND chat_id = $3
    `;
        yield chatsClient.query(deleteGroupChatQuery, [
            true, currentID, chatID
        ]);
        res.json({
            'message': 'Successfully deleted group chat'
        });
    }
    catch (error) {
        console.error('Internal error:', error);
        yield chatsClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/deleteGroupMessage', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chatID, messageID, currentID } = req.body;
    try {
        const deleteMessageQuery = `
      UPDATE group_messages.messages_history
      SET deleted_list = array_append(deleted_list, $1)
      WHERE message_id = $2
    `;
        yield chatsClient.query(deleteMessageQuery, [currentID, messageID]);
        res.json({
            'message': 'Successfully deleted group message'
        });
    }
    catch (error) {
        console.error('Internal error:', error);
        yield chatsClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/deleteGroupMessageForAll', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chatID, messageID, currentID, recipients } = req.body;
    try {
        console.log(recipients);
        recipients.push(currentID);
        const deleteMessageQuery = `
      UPDATE group_messages.messages_history
      SET deleted_list = array_cat(deleted_list, $1)
      WHERE message_id = $2
    `;
        yield chatsClient.query(deleteMessageQuery, [recipients, messageID]);
        res.json({
            'message': 'Successfully deleted group message'
        });
    }
    catch (error) {
        console.error('Internal error:', error);
        yield chatsClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/editGroupProfileData', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chatID, messageID, sender, recipients, newData } = req.body;
    try {
        console.log(req.body);
        var name = newData.name;
        var profilePicLink = newData.profilePicLink;
        var description = newData.description;
        const insertCurrentUserChatQuery = `
      INSERT INTO group_messages.messages_history(
        chat_id, message_id, type, content, sender, upload_time, medias_datas, deleted_list
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
        yield chatsClient.query(insertCurrentUserChatQuery, [
            chatID, messageID, 'edit_group_profile', '', sender, new Date().toISOString(), '[]',
            []
        ]);
        const updateGroupProfileDataQuery = `
      UPDATE group_profile.group_info
      SET name = $2, profile_pic_link = $3, description = $4
      WHERE chat_id = $1
    `;
        yield chatsClient.query(updateGroupProfileDataQuery, [
            chatID, name, profilePicLink, description
        ]);
        for (var i = 0; i < recipients.length; i++) {
            var recipient = recipients[i];
            const updateRecipientUserChatTableQuery = `
        UPDATE users_chats.chats_history
        SET deleted = $1
        WHERE user_id = $2 AND chat_id = $3
      `;
            yield chatsClient.query(updateRecipientUserChatTableQuery, [false, recipient, chatID]);
        }
        res.json({
            'message': 'Successfully edited group profile data'
        });
    }
    catch (error) {
        console.error('Internal error:', error);
        yield chatsClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/leaveGroup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chatID, messageID, sender, recipients, } = req.body;
    try {
        console.log(req.body);
        const insertCurrentUserChatQuery = `
      INSERT INTO group_messages.messages_history(
        chat_id, message_id, type, content, sender, upload_time, medias_datas, deleted_list
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
        yield chatsClient.query(insertCurrentUserChatQuery, [
            chatID, messageID, 'leave_group', '', sender, new Date().toISOString(), '[]',
            []
        ]);
        const removeSenderFromChatMembersQuery = `
      UPDATE group_profile.group_info 
      SET members = array_remove(members, $1)
      WHERE chat_id = $2
    `;
        yield chatsClient.query(removeSenderFromChatMembersQuery, [sender, chatID]);
        const removeChatFromSenderQuery = `
      DELETE FROM users_chats.chats_history WHERE user_id = $1 AND chat_id = $2
    `;
        yield chatsClient.query(removeChatFromSenderQuery, [
            sender, chatID
        ]);
        for (var i = 0; i < recipients.length; i++) {
            var recipient = recipients[i];
            const updateRecipientUserChatTableQuery = `
        UPDATE users_chats.chats_history
        SET deleted = $1
        WHERE user_id = $2 AND chat_id = $3
      `;
            yield chatsClient.query(updateRecipientUserChatTableQuery, [false, recipient, chatID]);
        }
        res.json({
            'message': 'Successfully left group'
        });
    }
    catch (error) {
        console.error('Internal error:', error);
        yield chatsClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchSearchedAddToGroupUsers', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { searchedText, recipients, currentID, currentLength, paginationLimit } = req.body;
    console.log(req.body);
    try {
        const fetchSearchedUsersDataQuery = `SELECT user_id FROM public."fetch_searched_add_to_group_users" ($1, $2, $3, $4, $5)`;
        const fetchSearchedUsersData = yield profilesClient.query(fetchSearchedUsersDataQuery, [
            searchedText, currentID, recipients, currentLength, paginationLimit
        ]);
        var searchedUsersData = fetchSearchedUsersData.rows.map((e) => e.user_id);
        var getCompleteUsersData = yield getUsersListBasicData(searchedUsersData, currentID);
        const usersProfileData = getCompleteUsersData.usersProfileData.map((e) => e.data.basic_data);
        console.log('successfully fetched searched users');
        res.json({
            'message': "Successfully fetched data",
            'usersProfileData': usersProfileData,
        });
    }
    catch (error) {
        console.error('Error fetching user data:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/addUsersToGroup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chatID, messagesID, sender, recipients, addedUsersID } = req.body;
    try {
        console.log(req.body);
        const deleteAllMessageQuery = `
      UPDATE group_messages.messages_history
      SET deleted_list = array_cat(deleted_list, $1)
      WHERE chat_id = $2
    `;
        yield chatsClient.query(deleteAllMessageQuery, [addedUsersID, chatID]);
        var typesArr = addedUsersID.map((e) => `add_users_to_group_${e}`);
        console.log(messagesID);
        const insertCurrentUserChatQuery = `
      INSERT INTO group_messages.messages_history(
        chat_id, message_id, type, content, sender, upload_time, medias_datas, deleted_list
      )
      SELECT
      $1 as chat_id,
      messageid as message_id,
      type as type,
      $2 as content,
      $3 as sender,
      $4 as upload_time,
      $5 as medias_datas,
      $6 as deleted_list
      FROM
      unnest($7::text[], $8::text[]) as u(messageid, type)
    `;
        yield chatsClient.query(insertCurrentUserChatQuery, [
            chatID, '', sender, new Date().toISOString(), '[]',
            [], messagesID, typesArr
        ]);
        const removeSenderFromChatMembersQuery = `
      UPDATE group_profile.group_info 
      SET members = array_cat(members, $1)
      WHERE chat_id = $2
    `;
        yield chatsClient.query(removeSenderFromChatMembersQuery, [addedUsersID, chatID]);
        for (var i = 0; i < recipients.length; i++) {
            var recipient = recipients[i];
            const updateRecipientUserChatTableQuery = `
        UPDATE users_chats.chats_history
        SET deleted = $1
        WHERE user_id = $2 AND chat_id = $3
      `;
            yield chatsClient.query(updateRecipientUserChatTableQuery, [false, recipient, chatID]);
        }
        for (var i = 0; i < addedUsersID.length; i++) {
            var userID = addedUsersID[i];
            const insertRecipientUserChatTableQuery = `
        INSERT INTO users_chats.chats_history(
          user_id, chat_id, type, recipient, deleted
        )
        VALUES ($1, $2, $3, $4, $5)
      `;
            yield chatsClient.query(insertRecipientUserChatTableQuery, [userID, chatID, 'group', '', false]);
        }
        res.json({
            'message': 'Successfully left group'
        });
    }
    catch (error) {
        console.error('Internal error:', error);
        yield chatsClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.get('/fetchGroupMembersData', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var { usersID, currentID, currentLength, paginationLimit, maxFetchLimit } = req.body;
    console.log(req.body);
    try {
        usersID = usersID.slice(currentLength, Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit)));
        var getCompleteUsersData = yield getUsersListFilteredData(usersID, currentID);
        const usersProfileData = getCompleteUsersData.usersProfileData;
        const usersSocialsData = getCompleteUsersData.usersSocialsData;
        res.json({
            message: "Successfully fetched data", usersProfileData: usersProfileData,
            usersSocialsData: usersSocialsData
        });
    }
    catch (error) {
        console.error('Error during fetching user followers:', error);
        res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/editPost', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postId, content, sender, mediasDatas, hashtags, taggedUsers, } = req.body;
    console.log(req.body);
    try {
        const fetchPostDataQuery = `
      SELECT * FROM posts_list.posts_data WHERE post_id = $1 AND sender = $2
    `;
        var fetchPostData = yield postsClient.query(fetchPostDataQuery, [postId, sender]);
        var postData = fetchPostData.rows[0];
        const insertPostDataQuery = `
      UPDATE posts_list.posts_data
      SET content = $1, medias_datas = $2
      WHERE post_id = $3 AND sender = $4
    `;
        const insertUpdateHashtagQuery = `
      INSERT INTO hashtags.hashtags_list (
        hashtag, hashtag_count
      )
      VALUES ($1, $2)
      ON CONFLICT (hashtag)
      DO UPDATE SET hashtag_count = hashtags_list.hashtag_count + 1;
    `;
        if (!postData.deleted) {
            try {
                yield postsClient.query('BEGIN');
                yield postsClient.query(insertPostDataQuery, [
                    content,
                    JSON.stringify(mediasDatas),
                    postId,
                    sender
                ]);
                yield postsClient.query('COMMIT');
                yield activitiesLogsClient.query('BEGIN');
                for (var i = 0; i < taggedUsers.length; i++) {
                    var taggedUser = taggedUsers[i];
                    if (taggedUser != sender) {
                        if ((yield userExists(taggedUser)) && !(yield isBlockedByUser(taggedUser, sender)) && !(yield userIsPrivateAndNotFollowedByCurrentID(taggedUser, sender))) {
                            const insertTaggedUserNotificationDataQuery = `
                INSERT INTO notifications_data.notifications_history (
                  type, sender, recipient, referenced_post_id, referenced_post_type, notified_time
                )
                VALUES ($1, $2, $3, $4, $5, $6)
              `;
                            yield activitiesLogsClient.query(insertTaggedUserNotificationDataQuery, [
                                'tagged', sender, taggedUser, postId, 'post', new Date().toISOString()
                            ]);
                        }
                    }
                }
                yield activitiesLogsClient.query('COMMIT');
                yield keywordsClient.query('BEGIN');
                for (var i = 0; i < hashtags.length; i++) {
                    var hashtag = hashtags[i];
                    yield keywordsClient.query(insertUpdateHashtagQuery, [
                        hashtag, 1
                    ]);
                }
                yield keywordsClient.query('COMMIT');
                console.log('successful');
                res.json({ message: 'Successfully edited the post' });
                console.log('User data inserted successfully');
            }
            catch (error) {
                // Rollback the transaction if any error occurs
                yield postsClient.query('ROLLBACK');
                console.error('Error uploading post:', error);
                // Send an error response to the postsClient
                res.json({ message: 'Server error' });
            }
        }
    }
    catch (error) {
        console.error('Error uploading post:', error);
        yield postsClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/editComment', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentID, content, sender, mediasDatas, parentPostID, parentPostSender, parentPostType, hashtags, taggedUsers } = req.body;
    console.log(req.body);
    try {
        const insertCommentDataQuery = `
      UPDATE comments_list.comments_data
      SET content = $1, medias_datas = $2
      WHERE comment_id = $3 AND sender = $4
    `;
        const insertUpdateHashtagQuery = `
      INSERT INTO hashtags.hashtags_list (
        hashtag, hashtag_count
      )
      VALUES ($1, $2)
      ON CONFLICT (hashtag)
      DO UPDATE SET hashtag_count = hashtags_list.hashtag_count + 1;
    `;
        try {
            if ((yield userExists(parentPostSender)) && !(yield isBlockedByUser(parentPostSender, sender))) {
                yield postsClient.query('BEGIN');
                yield postsClient.query(insertCommentDataQuery, [
                    content,
                    JSON.stringify(mediasDatas),
                    commentID,
                    sender
                ]);
                yield postsClient.query('COMMIT');
                yield activitiesLogsClient.query('BEGIN');
                for (var i = 0; i < taggedUsers.length; i++) {
                    var taggedUser = taggedUsers[i];
                    if (taggedUser != sender) {
                        if ((yield userExists(taggedUser)) && !(yield isBlockedByUser(taggedUser, sender)) && !(yield userIsPrivateAndNotFollowedByCurrentID(taggedUser, sender))) {
                            const insertTaggedUserNotificationDataQuery = `
                INSERT INTO notifications_data.notifications_history (
                  type, sender, recipient, referenced_post_id, referenced_post_type, notified_time
                )
                VALUES ($1, $2, $3, $4, $5, $6)
              `;
                            yield activitiesLogsClient.query(insertTaggedUserNotificationDataQuery, [
                                'tagged', sender, taggedUser, commentID, 'comment', new Date().toISOString()
                            ]);
                        }
                    }
                }
                yield activitiesLogsClient.query('COMMIT');
                yield keywordsClient.query('BEGIN');
                for (var i = 0; i < hashtags.length; i++) {
                    var hashtag = hashtags[i];
                    yield keywordsClient.query(insertUpdateHashtagQuery, [
                        hashtag, 1
                    ]);
                }
                yield keywordsClient.query('COMMIT');
                console.log('successful');
                res.json({ message: 'Successfully edited the comment' });
            }
            else {
                res.json({ message: 'failed to comment' });
            }
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield postsClient.query('ROLLBACK');
            console.error('Error uploading comment:', error);
            // Send an error response to the postsClient
            res.json({ message: 'Server error' });
        }
    }
    catch (error) {
        console.error('Error uploading post:', error);
        yield postsClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
usersRoutes.patch('/deleteAccount', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { currentID } = req.body;
    try {
        const insertUserDeletedQuery = `
      UPDATE basic_data.user_profile
      SET deleted = $2
      WHERE user_id = $1
    `;
        try {
            yield profilesClient.query('BEGIN');
            yield profilesClient.query(insertUserDeletedQuery, [
                currentID, true
            ]);
            yield profilesClient.query('COMMIT');
            console.log('successfully deleted');
            res.json({ message: 'Successfully deleted user' });
        }
        catch (error) {
            // Rollback the transaction if any error occurs
            yield profilesClient.query('ROLLBACK');
            console.error('Error deleting user:', error);
            // Send an error response to the profilesClient
            res.json({ message: 'Server error' });
        }
    }
    catch (error) {
        console.error('Error deleting user:', error);
        yield profilesClient.query('ROLLBACK');
        return res.json({ message: 'Internal Server Error' });
    }
}));
const postsSchemasList = [
    'likes_list', 'bookmarks_list', 'posts_comments_data',
];
const commentsSchemasList = [
    'likes_list.comments', 'bookmarks_list.comments', 'comments_comments_data'
];
const usersSchemasList = [
    'blocked_users', 'muted_users', 'followers_data', 'following_data', 'follow_requests_from', 'follow_requests_to'
];
const notificationsSchemasList = [
    'notifications_data'
];
usersRoutes.delete('/hardDeleteAccount', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { currentID } = req.body;
    const getAllPostsQuery = `SELECT * FROM posts_list.posts_data WHERE sender = $1`;
    const getAllPosts = yield postsClient.query(getAllPostsQuery, [currentID]);
    const allPosts = getAllPosts.rows;
    const getAllCommentsQuery = `SELECT * FROM comments_list.comments_data WHERE sender = $1`;
    const getAllComments = yield postsClient.query(getAllCommentsQuery, [currentID]);
    const allComments = getAllComments.rows;
    console.log('1');
    for (var i = 0; i < allPosts.length; i++) {
        if (allPosts[i].type == 'post') {
            var postData = allPosts[i];
            var postID = postData.post_id;
            for (var j = 0; j < postsSchemasList.length; j++) {
                const deleteEngagementsDataQuery = `
          DROP TABLE IF EXISTS "${postsSchemasList[j]}"."${postID}";
        `;
                yield postsClient.query(deleteEngagementsDataQuery, []);
            }
        }
        else {
            var commentData = allComments[i];
            var commentID = commentData.comment_id;
            for (var j = 0; j < commentsSchemasList.length; j++) {
                const deleteEngagementsDataQuery = `
          DROP TABLE IF EXISTS "${commentsSchemasList[j]}"."${commentID}";
        `;
                yield postsClient.query(deleteEngagementsDataQuery, []);
            }
        }
    }
    console.log('2');
    for (var i = 0; i < allComments.length; i++) {
        var commentData = allComments[i];
        var commentID = commentData.comment_id;
        for (var j = 0; j < commentsSchemasList.length; j++) {
            const deleteEngagementsDataQuery = `
        DROP TABLE IF EXISTS "${commentsSchemasList[j]}"."${commentID}";
      `;
            yield postsClient.query(deleteEngagementsDataQuery, []);
        }
    }
    console.log('3');
    const deletePostsSchemaQuery = `
    DROP SCHEMA IF EXISTS "${currentID}" CASCADE;
  `;
    yield postsClient.query(deletePostsSchemaQuery, []);
    console.log('4');
    for (var i = 0; i < usersSchemasList.length; i++) {
        const deleteUsersDataQuery = `
      DROP TABLE IF EXISTS "${usersSchemasList[i]}"."${currentID}";
    `;
        yield profilesClient.query(deleteUsersDataQuery, []);
    }
    for (var i = 0; i < notificationsSchemasList.length; i++) {
        const deleteActivitiesLogsDataQuery = `
      DROP TABLE IF EXISTS "${notificationsSchemasList[i]}"."${currentID}";
    `;
        yield activitiesLogsClient.query(deleteActivitiesLogsDataQuery, []);
    }
    console.log('5');
    const deleteUsersDataQuery = `
    DELETE FROM basic_data.user_profile WHERE user_id = $1;
  `;
    yield profilesClient.query(deleteUsersDataQuery, [currentID]);
    console.log('6');
    const deleteUsersPasswordQuery = `
    DELETE FROM sensitive_data.user_password WHERE user_id = $1;
  `;
    yield profilesClient.query(deleteUsersPasswordQuery, [currentID]);
    res.json({
        'message': 'Successfully deleted account'
    });
}));
export default usersRoutes;
