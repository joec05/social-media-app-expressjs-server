// userRoutes.ts
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import pkg from 'pg';
const { Client } = pkg;

const username = 'joec05';

const IP : String = '192.168.1.153';

const PORT : number = 5433;

const password : String = 'josccarl123';

const profilesDbConfig = {
  host: '192.168.1.153', // Your database host
  user: 'joec05', // Your database username
  password: 'josccarl123', // Your database password
  database: 'users_profiles', // Your database name,
  port: 5433
};

const postsDbConfig = {
  host: '192.168.1.153', // Your database host
  user: 'joec05', // Your database username
  password: 'josccarl123', // Your database password
  database: 'users_posts', // Your database name,
  port: 5433
};

const activitiesLogsDbConfig = {
  host: '192.168.1.153', // Your database host
  user: 'joec05', // Your database username
  password: 'josccarl123', // Your database password
  database: 'users_activities_logs', // Your database name,
  port: 5433
};

const keywordsDbConfig = {
  host: '192.168.1.153', // Your database host
  user: 'joec05', // Your database username
  password: 'josccarl123', // Your database password
  database: 'keywords', // Your database name,
  port: 5433
};

const chatsDbConfig = {
  host: '192.168.1.153', // Your database host
  user: 'joec05', // Your database username
  password: 'josccarl123', // Your database password
  database: 'users_chats', // Your database name,
  port: 5433
};

const profilesClient = new Client(profilesDbConfig);
profilesClient.connect().catch(err => console.error(err));

const postsClient = new Client(postsDbConfig);
postsClient.connect().catch(err => console.error(err));

const activitiesLogsClient = new Client(activitiesLogsDbConfig);
activitiesLogsClient.connect().catch(err => console.error(err));

const keywordsClient = new Client(keywordsDbConfig);
keywordsClient.connect().catch(err => console.error(err));

const chatsClient = new Client(chatsDbConfig);
chatsClient.connect().catch(err => console.error(err));

const usersRoutes = express.Router();
const secretKey = 'e52bc407-7c31-464f-bce4-8057ce1383ae';

// Login route
usersRoutes.post('/loginWithEmail', async (req, res) => {
  const { email, password } = req.body;
  try {
    const checkEmailQuery = 'SELECT * FROM basic_data.user_profile WHERE email = $1 AND suspended = $2 AND deleted = $3';
    const existingUser = await profilesClient.query(checkEmailQuery, [email, false, false]);

    if (existingUser.rows.length === 0) {
      return res.json({ message: 'Email not found' });
    }else{

      const user = existingUser.rows[0];
      const userId = user.user_id;

      const checkPasswordQuery = 'SELECT password FROM sensitive_data.user_password WHERE user_id = $1';
      const hashedPassword = await profilesClient.query(checkPasswordQuery, [userId]);

      if (hashedPassword.rows.length === 0) {
        return res.json({ message: 'Internal Server Error' });
      }else{
        const storedPassword = hashedPassword.rows[0].password;

        const passwordMatch = await bcrypt.compare(password, storedPassword);

        if (!passwordMatch) {
          return res.json({ message: 'Incorrect password' });
        }else{
          const token = jwt.sign({ userId }, secretKey, { expiresIn: '1h' });
          res.json({ message: 'Login successful', token, userID: userId, userProfileData: user});
        }
      }
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.post('/loginWithUsername', async (req, res) => {
  const { username, password } = req.body;
  try {
    const checkUsernameQuery = 'SELECT * FROM basic_data.user_profile WHERE username = $1 AND suspended = $2 AND deleted = $3';
    const existingUser = await profilesClient.query(checkUsernameQuery, [username, false, false]);
    if (existingUser.rows.length === 0) {
      return res.json({ message: 'Username not found' });
    }else{
      const user = existingUser.rows[0];
      const userId = user.user_id;
      const checkPasswordQuery = 'SELECT password FROM sensitive_data.user_password WHERE user_id = $1';
      const hashedPassword = await profilesClient.query(checkPasswordQuery, [userId]);
      if (hashedPassword.rows.length === 0) {
        return res.json({ message: 'Internal Server Error' });
      }else{
        const storedPassword = hashedPassword.rows[0].password;
        const passwordMatch = await bcrypt.compare(password, storedPassword);
        if (!passwordMatch) {
          return res.json({ message: 'Incorrect password' });
        }else{
          const token = jwt.sign({ userId }, secretKey, { expiresIn: '1h' });
          res.json({ message: 'Login successful', token, userID: userId, userProfileData: user});
        }
      }
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.json({ message: 'Internal Server Error' });
  }
});

// Signup route
usersRoutes.post('/signUp', async (req, res) => {
  const { 
    name,
    username,
    profilePicLink,
    email,
    password,
    birthDate
  } = req.body;

  try {
    const userId = uuidv4();
    const hashed = await bcrypt.hash(password, 10);

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
      await profilesClient.query('BEGIN');
      await profilesClient.query(insertUserProfileQuery, [
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
    
      await profilesClient.query(insertUserPasswordQuery, [userId, hashed]);
      await profilesClient.query('COMMIT');
      const token = jwt.sign({ userId }, secretKey, { expiresIn: '1h' });
      
      res.json({ message: 'Successfully signed up', token: token, userID: userId});
    } catch (error : any) {
      await profilesClient.query('ROLLBACK');
      console.error('Error inserting user data:', error);    
      res.json({ message: error.detail });
    }    
    
  } catch (error) {
    console.error('Internal error inserting user data:', error);
    await profilesClient.query('ROLLBACK');
    await postsClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/checkAccountExistsSignUp', async (req, res) => {
  const { 
    email,
    username
  } = req.body;

  try {
    const checkAccountExistsQuery = `
      SELECT * FROM basic_data.user_profile WHERE (email = $1 OR username = $2) AND suspended = $3 AND deleted = $4
    `;
    try {
      const checkAccountExists = await profilesClient.query(checkAccountExistsQuery, [
        email, username, false, false
      ]);
      const accountExists = checkAccountExists.rowCount > 0;
      res.json({'message': 'Successfully checked account existence', 'exists': accountExists});
    } catch (error : any) {
      // Rollback the transaction if any error occurs
      await profilesClient.query('ROLLBACK');
      console.error('Error inserting user data:', error);
    
      // Send an error response to the profilesClient
      res.json({ message: error.detail });
    }    
    
  } catch (error) {
    console.error('Internal error inserting user data:', error);
    await profilesClient.query('ROLLBACK');
    await postsClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/checkAccountExists', async (req, res) => {
  const { 
    userID
  } = req.body;

  try {
    const checkAccountExistsQuery = `
      SELECT * FROM basic_data.user_profile WHERE user_id = $1 AND suspended = $2 AND deleted = $3
    `;
    try {
      const checkAccountExists = await profilesClient.query(checkAccountExistsQuery, [
        userID, false, false
      ]);
      const accountExists = checkAccountExists.rowCount > 0;
      res.json({'message': 'Successfully checked account existence', 'exists': accountExists});
    } catch (error : any) {
      // Rollback the transaction if any error occurs
      await profilesClient.query('ROLLBACK');
      console.error('Error inserting user data:', error);
    
      // Send an error response to the profilesClient
      res.json({ message: error.detail });
    }    
    
  } catch (error) {
    console.error('Internal error inserting user data:', error);
    await profilesClient.query('ROLLBACK');
    await postsClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.post('/completeSignUpProfile', async (req, res) => {
  const { 
    userId,
    profilePicLink,
    bio
  } = req.body;
  
  try {
    const insertUserProfileQuery = `
      UPDATE basic_data.user_profile
      SET profile_picture_link = $2, bio = $3
      WHERE user_id = $1
    `;

    try {
      await profilesClient.query('BEGIN');
      await profilesClient.query(insertUserProfileQuery, [
        userId,
        profilePicLink,
        bio,
      ]);
      await profilesClient.query('COMMIT');
      res.json({ message: 'Successfully updated your account'});
      
    } catch (error) {
      // Rollback the transaction if any error occurs
      await profilesClient.query('ROLLBACK');
    
      console.error('Error inserting user data:', error);
    
      // Send an error response to the profilesClient
      res.json({ message: 'Server error' });
    }    
    
  } catch (error) {
    console.error('Error inserting user data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.post('/uploadPost', async (req, res) => {
  const { 
    postId,
    content,
    sender,
    mediasDatas,
    hashtags,
    taggedUsers
  } = req.body;

  

  try {
    const insertPostDataQuery = `
      INSERT INTO posts_list.posts_data (
        post_id, type, content, sender, upload_time, medias_datas, deleted
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    //var uuidArr = new Array(1500000).fill(0).map(() => uuidv4());
    //var contentsArr = new Array(1500000).fill(0).map((e, i) => `fanatic ${Math.random() * 100000} gate ${i}`);

    const insertUpdateHashtagQuery = `
      INSERT INTO hashtags.hashtags_list (
        hashtag, hashtag_count
      )
      VALUES ($1, $2)
      ON CONFLICT (hashtag)
      DO UPDATE SET hashtag_count = hashtags_list.hashtag_count + 1;
    `;

    try {
      await postsClient.query('BEGIN');
      await postsClient.query(insertPostDataQuery, [
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
      await postsClient.query('COMMIT');

      await activitiesLogsClient.query('BEGIN');
      for(var i = 0; i < taggedUsers.length; i++){
        var taggedUser = taggedUsers[i];
        if(taggedUser != sender){
          if(await userExists(taggedUser) && !await isBlockedByUser(taggedUser, sender) && !await userIsPrivateAndNotFollowedByCurrentID(taggedUser, sender)){
            const insertTaggedUserNotificationDataQuery = `
              INSERT INTO notifications_data.notifications_history (
                type, sender, recipient, referenced_post_id, referenced_post_type, notified_time
              )
              VALUES ($1, $2, $3, $4, $5, $6)
            `;
            await activitiesLogsClient.query(insertTaggedUserNotificationDataQuery, [
              'tagged', sender, taggedUser, postId, 'post', new Date().toISOString()
            ])
          }
        }
      }
      await activitiesLogsClient.query('COMMIT');

      await keywordsClient.query('BEGIN');
      for(var i = 0; i < hashtags.length; i++){
        var hashtag = hashtags[i];
        await keywordsClient.query(insertUpdateHashtagQuery, [
          hashtag, 1
        ]);
      }
      await keywordsClient.query('COMMIT');

      
      res.json({ message: 'Successfully uploaded the post'});
      
    } catch (error) {
      // Rollback the transaction if any error occurs
      await postsClient.query('ROLLBACK');
    
      console.error('Error uploading post:', error);
    
      // Send an error response to the postsClient
      res.json({ message: 'Server error' });
    }    
    
  } catch (error) {
    console.error('Error uploading post:', error);
    await postsClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

async function userIsPrivateAndNotFollowedByCurrentID(userID: String, currentID: String) {
  if(userID == currentID){return false};
  const userIDBasicData = await getBasicUserProfileData(userID);
  if(userIDBasicData.private){
    const fetchUserIDFollowersDataQuery = `SELECT * FROM follow_users.follow_history WHERE following_id = $1 AND followed_id = $2`;
    const fetchUserIDFollowersData = await profilesClient.query(fetchUserIDFollowersDataQuery, [currentID, userID]);
    return fetchUserIDFollowersData.rowCount == 0;
  }else{
    return false;
  }
}


async function getRequestsDataByUser(userID: String, searchedRequestedUser: String){
  const fetchUserIDRequestsDataQuery = `SELECT * FROM follow_requests_users.follow_request_history WHERE requesting_id = $1 AND requested_id = $2`;
  const fetchUserIDRequestsFromData = await profilesClient.query(fetchUserIDRequestsDataQuery, [userID, searchedRequestedUser]);
  const userIDRequestsFromDataCount = fetchUserIDRequestsFromData.rowCount;
  const fetchUserIDRequestsToData = await profilesClient.query(fetchUserIDRequestsDataQuery, [searchedRequestedUser, userID]);
  const userIDRequestsToDataCount = fetchUserIDRequestsToData.rowCount;

  return {
    requested_by_current_id: userIDRequestsFromDataCount > 0,
    requests_to_current_id: userIDRequestsToDataCount > 0
  }
}

async function isMutedByUser(userID : String, searchedMutedUser : String){
  if(userID == searchedMutedUser){return false}
  const fetchUserIDMutedUsersDataQuery = `SELECT * FROM muted_users.mute_history WHERE user_id = $1 AND muted_id = $2`;
  const fetchUserIDMutedUsersData = await profilesClient.query(fetchUserIDMutedUsersDataQuery, [userID, searchedMutedUser]);
  const userIDMutedUsersDataCount = fetchUserIDMutedUsersData.rowCount;
  return userIDMutedUsersDataCount > 0;
}

async function isBlockedByUser(userID : String, searchedBlockedUser : String){
  if(userID == searchedBlockedUser){return false}
  const fetchUserIDBlockedUsersDataQuery = `SELECT * FROM blocked_users.block_history WHERE user_id = $1 AND blocked_id = $2`;
  const fetchUserIDBlockedUsersData = await profilesClient.query(fetchUserIDBlockedUsersDataQuery, [userID, searchedBlockedUser]);
  const userIDBlockedUsersDataCount = fetchUserIDBlockedUsersData.rowCount;
  return userIDBlockedUsersDataCount > 0;
}

async function userExists(searchedUser : String){
  const fetchUserIDExistsUsersDataQuery = `SELECT * FROM basic_data.user_profile WHERE user_id = $1 AND suspended = $2 AND deleted = $3`;
  const fetchUserIDExistsUsersData = await profilesClient.query(fetchUserIDExistsUsersDataQuery, [searchedUser, false, false]);
  const userIDExistsUsersDataCount = fetchUserIDExistsUsersData.rowCount;
  return userIDExistsUsersDataCount > 0;
}

async function getFilteredCompleteUserProfileData(userID: String, currentID: String){
  var successfulCode = 100;
  var blacklistedCode = 0;
  
  var res = {
    data: {basic_data: {}, socials_data: {}},
    code: blacklistedCode
  };
  var relations = {
    muted_by_current_id: false,
    blocked_by_current_id: false,
    blocks_current_id: false,
    requested_by_current_id: false,
    requests_to_current_id: false
  };

  if(await isMutedByUser(currentID, userID)){
    relations.muted_by_current_id = true;
  }else{
    if(await isBlockedByUser(currentID, userID)){
      relations.blocked_by_current_id = true;
    }else{
      if(await isBlockedByUser(userID, currentID)){
        relations.blocks_current_id = true;
      }else{
        const userIDProfileData = await getBasicUserProfileData(userID);
        if(!userIDProfileData.suspended && !userIDProfileData.deleted){
          const userIDSocialsData : any = await getUserSocialsData(userID, currentID);
          var currentIDInUserRequests = await getRequestsDataByUser(currentID, userID);
          relations.requested_by_current_id = currentIDInUserRequests.requested_by_current_id;
          relations.requests_to_current_id = currentIDInUserRequests.requests_to_current_id;
          res.code = successfulCode;
          res.data = {basic_data: {...userIDProfileData, ...relations}, socials_data: userIDSocialsData};
        }
      }
    }
  }
  return res;
}

async function getFilteredFromUserIDBasicUserProfileData(userID: String, currentID: String){
  var successfulCode = 100;
  var blacklistedCode = 0;
  var res = {
    data: {basic_data: {}},
    code: blacklistedCode
  };
  var relations = {
    blocks_current_id: false,
    muted_by_current_id: await isMutedByUser(currentID, userID),
    blocked_by_current_id: false,
    requested_by_current_id: false,
    requests_to_current_id: false,
  };
  const userIDProfileData = await getBasicUserProfileData(userID);
  res.code = successfulCode;
  res.data = {basic_data: {...userIDProfileData, ...relations}};
  return res;
}

async function getCompleteUserProfileData(userID: String, currentID: String){
  var res = {
    data: {basic_data: {}, socials_data: {}},
  };
  var currentIDInUserRequests = await getRequestsDataByUser(currentID, userID);
  
  var relations = {
    muted_by_current_id: await isMutedByUser(currentID, userID),
    blocked_by_current_id: await isBlockedByUser(currentID, userID),
    blocks_current_id: await isBlockedByUser(userID, currentID),
    requested_by_current_id: currentIDInUserRequests.requested_by_current_id,
    requests_to_current_id: currentIDInUserRequests.requests_to_current_id
  };
  const userIDProfileData = await getBasicUserProfileData(userID);
  const userIDSocialsData = await getUserSocialsData(userID, currentID);
  res.data = {basic_data: {...userIDProfileData, ...relations}, socials_data: userIDSocialsData};
  return {...res};
}

enum RequestType{
  From, To
}

async function getRequesterProfileData(userID: String, currentID: String, requestType : RequestType){
  var res = {
    data: {basic_data: {}, socials_data: {}},
  };
  var relations = {
    muted_by_current_id: false,
    blocked_by_current_id: false,
    blocks_current_id: false,
    requested_by_current_id: requestType == RequestType.From ? true : false,
    requests_to_current_id: requestType == RequestType.To ? true : false
  };
  const userIDProfileData = await getBasicUserProfileData(userID);
  const userIDSocialsData = await getUserSocialsData(userID, currentID);
  res.data = {basic_data: {...userIDProfileData, ...relations}, socials_data: userIDSocialsData};
  return {...res};
}

async function getCompleteUserProfileDataWithUsername(username: String, currentID: String){

  const fetchUserIDProfileDataQuery = 'SELECT * FROM basic_data.user_profile WHERE username = $1';
  const fetchUserIDProfileData = await profilesClient.query(fetchUserIDProfileDataQuery, [username]);
  const userIDProfileData = fetchUserIDProfileData.rows[0];
  var userID: String = userIDProfileData.user_id;

  var currentIDInUserRequests = await getRequestsDataByUser(currentID, userID);
  
  var res = {
    data: {basic_data: {}, socials_data: {}},
  };
  var relations = {
    muted_by_current_id: await isMutedByUser(currentID, userID),
    blocked_by_current_id: await isBlockedByUser(currentID, userID),
    blocks_current_id: false,
    requested_by_current_id: currentIDInUserRequests.requested_by_current_id,
    requests_to_current_id: currentIDInUserRequests.requests_to_current_id
  };
  relations.blocks_current_id = await isBlockedByUser(userID, currentID);
  const userIDSocialsData = await getUserSocialsData(userID, currentID);
  res.data = {basic_data: {...userIDProfileData, ...relations}, socials_data: userIDSocialsData};
  return {...res};
  
  
}

async function getBasicUserProfileData(userID: String){
  const fetchUserIDProfileDataQuery = 'SELECT * FROM basic_data.user_profile WHERE user_id = $1';
  const fetchUserIDProfileData = await profilesClient.query(fetchUserIDProfileDataQuery, [userID]);
  const userIDProfileData = fetchUserIDProfileData.rows[0];
  var relations = {
    muted_by_current_id: false,
    blocked_by_current_id: false,
    blocks_current_id: false,
    requested_by_current_id: false,
    requests_to_current_id: false
  };
  return {...userIDProfileData, ...relations};
}

async function getUserSocialsData(userID: String, currentID: String){
  const fetchUserIDFollowersDataQuery = `SELECT following_id FROM follow_users.follow_history WHERE followed_id = $1`;
  const fetchUserIDFollowersData = await profilesClient.query(fetchUserIDFollowersDataQuery, [userID]);
  const userIDFollowersData = fetchUserIDFollowersData.rows.map((e) => e.following_id);

  const fetchUserIDFollowingDataQuery = `SELECT followed_id FROM follow_users.follow_history WHERE following_id = $1`;
  const fetchUserIDFollowingData = await profilesClient.query(fetchUserIDFollowingDataQuery, [userID]);
  const userIDFollowingData = fetchUserIDFollowingData.rows.map((e) => e.followed_id);

  var followedByCurrentID = userIDFollowersData.includes(currentID);
  var followsCurrentID = userIDFollowingData.includes(currentID);
  
  return {
    followers_count: userIDFollowersData.length, 
    following_count: userIDFollowingData.length,
    followed_by_current_id: followedByCurrentID,
    follows_current_id: followsCurrentID
  }
}

usersRoutes.get('/fetchCurrentUserProfile', async (req, res) => {
  const { 
    currentID
  } = req.body;
  

  try {
    res.json({message: "Successfully fetched data", 
    userProfileData: await getBasicUserProfileData(currentID),
    }); 
    
  } catch (error) {
    console.error('Error fetching user data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchUserProfileSocials', async (req, res) => {
  const { 
    userID,
    currentID,
  } = req.body;
  
  try {
    var completeProfileData = await getCompleteUserProfileData(userID, currentID);
    res.json({message: "Successfully fetched data", 
    userProfileData: completeProfileData.data.basic_data, 
    userSocialsData: completeProfileData.data.socials_data
  });
    
  } catch (error) {
    console.error('Error fetching user data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchUserProfileSocialsWithUsername', async (req, res) => {
  const { 
    username,
    currentID
  } = req.body;
  

  try {
    var userProfileData = await getCompleteUserProfileDataWithUsername(username, currentID);
    res.json({message: "Successfully fetched data", 
      userProfileData: userProfileData.data.basic_data, 
      userSocialsData: userProfileData.data.socials_data,
    });
    
  } catch (error) {
    console.error('Error fetching user data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.patch('/editUserProfile', async (req, res) => {
  const { 
    userID,
    name,
    username,
    profilePicLink,
    bio,
    birthDate
  } = req.body;
  

  try{
    const insertEditUserProfileQuery = `
      UPDATE basic_data.user_profile
      SET name = $2, username = $3, profile_picture_link = $4, bio = $5, birth_date = $6
      WHERE user_id = $1
    `;

    try {
      await profilesClient.query('BEGIN');
      await profilesClient.query(insertEditUserProfileQuery, [
        userID, name, username, profilePicLink, bio, birthDate
      ]);
      await profilesClient.query('COMMIT');
      
      res.json({ message: 'Successfully updated user profile'});
    } catch (error) {
      // Rollback the transaction if any error occurs
      await profilesClient.query('ROLLBACK');
    
      console.error('Error updating user profile:', error);
    
      // Send an error response to the profilesClient
      res.json({ message: 'Server error' });
    }
  } catch (error) {
    console.error('Error updating profile data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

async function getPostEngagementsData(postID : String, sender : String, currentID : String){
  const fetchPostEngagementsDataQuery = `SELECT * FROM public."fetch_post_engagements"($1, $2)`;
  const fetchPostEngagementsData = await postsClient.query(fetchPostEngagementsDataQuery, [
    currentID, postID
  ]);
  const postEngagementsData = fetchPostEngagementsData.rows[0];
  
  

  return {
    'liked_by_current_id': postEngagementsData.liked_by_current_id,
    'likes_count': postEngagementsData.likes_count,
    'bookmarked_by_current_id': postEngagementsData.bookmarked_by_current_id,
    'bookmarks_count': postEngagementsData.bookmarks_count,
    'comments_count': postEngagementsData.comments_count
  }
}

async function getCommentEngagementsData(commentID : String, sender: String, currentID: String){
  const fetchCommentEngagementsDataQuery = `SELECT * FROM public."fetch_comment_engagements"($1, $2)`;
  const fetchCommentEngagementsData = await postsClient.query(fetchCommentEngagementsDataQuery, [
    currentID, commentID
  ]);
  const commentEngagementsData = fetchCommentEngagementsData.rows[0];
  
  

  return {
    'liked_by_current_id': commentEngagementsData.liked_by_current_id,
    'likes_count': commentEngagementsData.likes_count,
    'bookmarked_by_current_id': commentEngagementsData.bookmarked_by_current_id,
    'bookmarks_count': commentEngagementsData.bookmarks_count,
    'comments_count': commentEngagementsData.comments_count
  }
}

async function getPostsListFilteredData(dataList : any, currentID : String){
  var completeDataList = [];
  var usersProfileData = [];
  var usersSocialsData = [];
  var usersID : String[] = [];
  var blacklistedUsersID : String[] = [];
  for(var i = 0; i < dataList.length; i++){
    
    
    if(dataList[i].type == 'post'){
      var postData = dataList[i];
      if(!usersID.includes(postData.sender) && !blacklistedUsersID.includes(postData.sender)){
        var userProfileData = await getFilteredCompleteUserProfileData(postData.sender, currentID);
        if(userProfileData.code == 100){
          usersID.push(postData.sender);
          var engagementsData = await getPostEngagementsData(postData.post_id, postData.sender, currentID);
          completeDataList.push({...postData, ...engagementsData});
          usersProfileData.push(userProfileData.data.basic_data);
          usersSocialsData.push(userProfileData.data.socials_data);
        }else{
          blacklistedUsersID.push(postData.sender);
        }
      }else{
        if(!blacklistedUsersID.includes(postData.sender)){
          var engagementsData = await getPostEngagementsData(postData.post_id, postData.sender, currentID);
          completeDataList.push({...postData, ...engagementsData});
        }
      }
    }else if(dataList[i].type == 'comment'){
      var commentData = dataList[i];
      if(!usersID.includes(commentData.sender) && !blacklistedUsersID.includes(commentData.sender)){
        var userProfileData = await getFilteredCompleteUserProfileData(commentData.sender, currentID);
        if(userProfileData.code == 100){
          usersID.push(commentData.sender);
          var engagementsData = await getCommentEngagementsData(commentData.comment_id, commentData.sender, currentID);
          completeDataList.push({...commentData, ...engagementsData});
          usersProfileData.push(userProfileData.data.basic_data);
          usersSocialsData.push(userProfileData.data.socials_data);

          var parentPostSenderID = commentData.parent_post_sender;
          if(!usersID.includes(parentPostSenderID)){
            var parentPostSenderProfileData = await getCompleteUserProfileData(parentPostSenderID, currentID);
            usersID.push(parentPostSenderID);
            usersProfileData.push(parentPostSenderProfileData.data.basic_data);
            usersSocialsData.push(parentPostSenderProfileData.data.socials_data);
          }
        }else{
          blacklistedUsersID.push(commentData.sender);
        }
      }else{
        if(!blacklistedUsersID.includes(commentData.sender)){
          var engagementsData = await getCommentEngagementsData(commentData.comment_id, commentData.sender, currentID);
          completeDataList.push({...commentData, ...engagementsData});

          var parentPostSenderID = commentData.parent_post_sender;
          if(!usersID.includes(parentPostSenderID)){
            var parentPostSenderProfileData = await getCompleteUserProfileData(parentPostSenderID, currentID);
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
  }
}

async function getPostsListCompleteData(dataList : any, currentID : String){
  var completeDataList = [];
  var usersProfileData = [];
  var usersSocialsData = [];
  var usersID : String[] = [];
  for(var i = 0; i < dataList.length; i++){
    if(dataList[i].type == 'post'){
      var postData = dataList[i];
      if(!usersID.includes(postData.sender)){
        var userProfileData = await getCompleteUserProfileData(postData.sender, currentID);
        usersID.push(postData.sender);
        var engagementsData = await getPostEngagementsData(postData.post_id, postData.sender, currentID);
        completeDataList.push({...postData, ...engagementsData});
        usersProfileData.push(userProfileData.data.basic_data);
        usersSocialsData.push(userProfileData.data.socials_data);
      }else{
        var engagementsData = await getPostEngagementsData(postData.post_id, postData.sender, currentID);
        completeDataList.push({...postData, ...engagementsData});
      }
    }else if(dataList[i].type == 'comment'){
      var commentData = dataList[i];
      if(!usersID.includes(commentData.sender)){
        var userProfileData = await getCompleteUserProfileData(commentData.sender, currentID);
        usersID.push(commentData.sender);
        var engagementsData = await getCommentEngagementsData(commentData.comment_id, commentData.sender,  currentID);
        completeDataList.push({...commentData, ...engagementsData});
        usersProfileData.push(userProfileData.data.basic_data);
        usersSocialsData.push(userProfileData.data.socials_data);

        var parentPostSenderID = commentData.parent_post_sender;
        if(!usersID.includes(parentPostSenderID)){
          var parentPostSenderProfileData = await getCompleteUserProfileData(parentPostSenderID, currentID);
          usersID.push(parentPostSenderID);
          usersProfileData.push(parentPostSenderProfileData.data.basic_data);
          usersSocialsData.push(parentPostSenderProfileData.data.socials_data);
        }
      }else{
        var engagementsData = await getCommentEngagementsData(commentData.comment_id, commentData.sender, currentID);
        completeDataList.push({...commentData, ...engagementsData});

        var parentPostSenderID = commentData.parent_post_sender;
        if(!usersID.includes(parentPostSenderID)){
          var parentPostSenderProfileData = await getCompleteUserProfileData(parentPostSenderID, currentID);
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
  }
}

async function getUsersListBasicData(dataList : any, currentID : String){
  var usersProfileData = [];
  var usersID : String[] = [];
  var blacklistedUsersID : String[] = [];
  for(var i = 0; i < dataList.length; i++){
    var userID = dataList[i];
    if(!usersID.includes(userID)){
      var userProfileData = await getFilteredFromUserIDBasicUserProfileData(userID, currentID);
      if(userProfileData.code == 100){
        usersID.push(userID);
        usersProfileData.push(userProfileData);
      }else{
        blacklistedUsersID.push(userID);
      }
    }
  }

  return {
    usersProfileData: usersProfileData,
    usersIDList: usersID,
  }
}

async function getUsersListCompleteData(dataList : any, currentID : String){
  var usersProfileData = [];
  var usersSocialsData = [];
  var usersID : String[] = [];
  for(var i = 0; i < dataList.length; i++){
    var userID = dataList[i];
    if(!usersID.includes(userID)){
      var userProfileData = await getCompleteUserProfileData(userID, currentID);
      usersID.push(userID);
      usersProfileData.push(userProfileData.data.basic_data);
      usersSocialsData.push(userProfileData.data.socials_data);
    }
  }

  return {
    usersProfileData: usersProfileData,
    usersSocialsData: usersSocialsData,
    usersIDList: usersID,
  }
}

async function getUsersListFilteredData(dataList : any, currentID : String){
  var usersProfileData = [];
  var usersSocialsData = [];
  var usersID : String[] = [];
  for(var i = 0; i < dataList.length; i++){
    var userID = dataList[i];
    if(!usersID.includes(userID)){
      var userProfileData = await getFilteredCompleteUserProfileData(userID, currentID);
      if(userProfileData.code == 100){
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
  }
}



usersRoutes.get('/fetchUserPosts', async (req, res) => {
  const { 
    userID,
    currentID,
    currentLength,
    paginationLimit,
    maxFetchLimit
  } = req.body;
  

  try {
    const fetchUserIDPostsDataQuery = `SELECT * FROM posts_list.posts_data WHERE sender = $1 AND deleted = false ORDER BY upload_time DESC OFFSET $2 LIMIT $3`;
    const fetchUserIDPostsData = await postsClient.query(fetchUserIDPostsDataQuery, [userID, currentLength, Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1))]);
    const userIDPostsData = fetchUserIDPostsData.rows;
    
    const dataLength = userIDPostsData.length;
    if(dataLength > paginationLimit){
      userIDPostsData.pop();
    }
    
    
    var getCompletePostsData = await getPostsListFilteredData(userIDPostsData, currentID);
    const completePostsList = getCompletePostsData.completeDataList; 
    const usersProfileData = getCompletePostsData.usersProfileData;
    const usersSocialsData = getCompletePostsData.usersSocialsData;
    
    res.json({
      message: "Successfully fetched data", 
      userPostsData: completePostsList, 
      canPaginate: dataLength > paginationLimit, 
      usersProfileData: usersProfileData, 
      usersSocialsData: usersSocialsData
    });

    
    
  } catch (error) {
    console.error('Error fetching user data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchUserComments', async (req, res) => {
  const { 
    userID,
    currentID,
    currentLength,
    paginationLimit,
    maxFetchLimit
  } = req.body;
  

  try {
    const fetchUserIDRepliesDataQuery = `SELECT * FROM comments_list.comments_data WHERE sender = $1 AND deleted = false ORDER BY upload_time DESC OFFSET $2 LIMIT $3`;
    const fetchUserIDRepliesData = await postsClient.query(fetchUserIDRepliesDataQuery, [
      userID,
      currentLength, 
      Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1))
    ]);
    const userIDRepliesData = fetchUserIDRepliesData.rows;

    const dataLength = userIDRepliesData.length;
    if(dataLength > paginationLimit){
      userIDRepliesData.pop();
    }

    var getCompletePostsData = await getPostsListFilteredData(userIDRepliesData, currentID);
    const completePostsList = getCompletePostsData.completeDataList; 
    const usersProfileData = getCompletePostsData.usersProfileData;
    const usersSocialsData = getCompletePostsData.usersSocialsData;

    res.json({message: "Successfully fetched data", userCommentsData: completePostsList, canPaginate: dataLength > paginationLimit,
    usersProfileData: usersProfileData, usersSocialsData: usersSocialsData});
    
  } catch (error) {
    console.error('Error fetching user data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchUserBookmarks', async (req, res) => {
  const { 
    currentID,
    currentLength,
    paginationLimit,
    maxFetchLimit
  } = req.body;
  

  try {
    const fetchBookmarksDataQuery = `SELECT * FROM public."fetch_user_bookmarks"($1, $2, $3, $4, $5, $6, $7)`;
    const fetchBookmarksData = await postsClient.query(fetchBookmarksDataQuery, [
      currentID,
      currentLength, 
      Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1)),
      username, IP, PORT, password
    ]);
    const bookmarksData = fetchBookmarksData.rows;
    
    
    const dataLength = bookmarksData.length;
    if(dataLength > paginationLimit){
      bookmarksData.pop();
    };
    
    bookmarksData.forEach((e, i) => {
      bookmarksData[i] = e.post_data
    });
    var getCompletePostsData = await getPostsListCompleteData(bookmarksData, currentID);
    const completePostsList = getCompletePostsData.completeDataList; 
    const usersProfileData = getCompletePostsData.usersProfileData;
    const usersSocialsData = getCompletePostsData.usersSocialsData;

    res.json({
      message: "Successfully fetched data", userBookmarksData: completePostsList, 
      usersProfileData: usersProfileData, usersSocialsData: usersSocialsData,
      canPaginate: dataLength > paginationLimit
    });
    
  } catch (error) {
    console.error('Error fetching user data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchFeed', async (req, res) => {
  const {
    userID,
    currentLength,
    paginationLimit,
    maxFetchLimit
  } = req.body;
  
  try{
    const fetchFollowingDataQuery = `SELECT * FROM public."fetch_feed" ($1, $2, $3, $4, $5, $6, $7)`;
    const fetchFollowingData = await postsClient.query(fetchFollowingDataQuery, [
      userID, 0, maxFetchLimit, username, IP, PORT, password
    ]);
    const feedPosts : String[] = fetchFollowingData.rows.map((e) => e.post_data);
    const totalPostsLength = Math.min(maxFetchLimit, feedPosts.length);
    var modifiedFeedPosts = [...feedPosts];
    modifiedFeedPosts = modifiedFeedPosts.slice(0, Math.min(feedPosts.length - currentLength, paginationLimit));
    
    var getCompletePostsData = await getPostsListFilteredData(modifiedFeedPosts, userID);
    const completePostsList = getCompletePostsData.completeDataList; 
    var usersProfileData : any[] = getCompletePostsData.usersProfileData;
    var usersSocialsData = getCompletePostsData.usersSocialsData;

    if(usersProfileData.find((e) => e.user_id == userID) == null){
      var currentUserCompleteData = await getCompleteUserProfileData(userID, userID);
      usersProfileData.push(currentUserCompleteData.data.basic_data);
      usersSocialsData.push(currentUserCompleteData.data.socials_data);
    }

    res.json({
      'message': "Successfully fetched data",
      'usersProfileData': usersProfileData,
      'usersSocialsData': usersSocialsData,
      'feedPosts': feedPosts,
      'modifiedFeedPosts': completePostsList,
      'totalPostsLength': totalPostsLength,
    })
  } catch (error) {
    console.error('Error fetching user data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchFeedPagination', async (req, res) => {
  var {
    userID,
    feedPostsEncoded,
  } = req.body;

  try{
    var modifiedFeedPosts = JSON.parse(feedPostsEncoded);

    
    var getCompletePostsData = await getPostsListFilteredData(modifiedFeedPosts, userID);
    const completePostsList = getCompletePostsData.completeDataList; 
    const usersProfileData = getCompletePostsData.usersProfileData;
    const usersSocialsData = getCompletePostsData.usersSocialsData;

    
    res.json({
      'message': "Successfully fetched data",
      'usersProfileData': usersProfileData,
      'usersSocialsData': usersSocialsData,
      'modifiedFeedPosts': completePostsList,

    })
  } catch (error) {
    console.error('Error fetching user data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.patch('/likePost', async (req, res) => {
  const { 
    currentID,
    sender,
    postID,
  } = req.body;
  
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
      if(await userExists(sender) && !await isBlockedByUser(sender, currentID) && !await userIsPrivateAndNotFollowedByCurrentID(sender, currentID)){
        await postsClient.query('BEGIN');
        await postsClient.query(insertLikePostQuery, [
          currentID, postID
        ]);
        await postsClient.query('COMMIT');

        await activitiesLogsClient.query('BEGIN');
        if(sender != currentID){
          if(!await isBlockedByUser(currentID, sender) && !await isMutedByUser(sender, currentID)){
            await activitiesLogsClient.query(insertNewANotificationDataQuery, [
              'like', currentID, sender, postID, 'post', new Date().toISOString()
            ]);
          }
        }

        await activitiesLogsClient.query('COMMIT');

        
        res.json({ message: 'Successfully liked the post'});
      }else{
        res.json({message: 'Failed to like'});
      }
    } catch (error) {
      // Rollback the transaction if any error occurs
      await postsClient.query('ROLLBACK');
    
      console.error('Error liking post:', error);
    
      // Send an error response to the profilesClient
      res.json({ message: 'Server error' });
    }    
    
  } catch (error) {
    console.error('Error liking post:', error);
    await postsClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.patch('/unlikePost', async (req, res) => {
  const { 
    currentID,
    sender,
    postID,
  } = req.body;
  
  try {

    const insertUnlikePostQuery = `
      DELETE FROM likes_list.posts WHERE user_id = $1 AND post_id = $2;
    `;

    try {
      if(await userExists(sender) && !await isBlockedByUser(sender, currentID) && !await userIsPrivateAndNotFollowedByCurrentID(sender, currentID)){
        await postsClient.query('BEGIN');
        await postsClient.query(insertUnlikePostQuery, [
          currentID, postID
        ]);
        await postsClient.query('COMMIT');
        res.json({ message: 'Successfully unliked the post'});
      }else{
        res.json({message: 'failed to unlike'})
      }
    } catch (error) {
      // Rollback the transaction if any error occurs
      await profilesClient.query('ROLLBACK');
    
      console.error('Error unliking post:', error);
    
      // Send an error response to the profilesClient
      res.json({ message: 'Server error' });
    }    
    
  } catch (error) {
    console.error('Error unliking post:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.patch('/bookmarkPost', async (req, res) => {
  const { 
    currentID,
    sender,
    postID,
  } = req.body;
  
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
    const fetchPostData = await postsClient.query(fetchPostDataQuery, [
      sender, postID, JSON.stringify(false)
    ]);
    const postDataList = fetchPostData.rows;


    const insertNewANotificationDataQuery = `
      INSERT INTO notifications_data.notifications_history (
        type, sender, recipient, referenced_post_id, referenced_post_type, notified_time
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    if(postDataList.length > 0){
      try {
        if(await userExists(sender) && !await isBlockedByUser(sender, currentID) && !await userIsPrivateAndNotFollowedByCurrentID(sender, currentID)){
          await postsClient.query('BEGIN');
          await postsClient.query(insertBookmarkPostQuery, [currentID, postID, sender, new Date()]);
          await postsClient.query('COMMIT');

          await activitiesLogsClient.query('BEGIN');


          if(sender != currentID){
            if(!await isBlockedByUser(currentID, sender) && !await isMutedByUser(sender, currentID)){
              await activitiesLogsClient.query(insertNewANotificationDataQuery, [
                'bookmark', currentID, sender, postID, 'post', new Date().toISOString()
              ]);
            }
          }

          await activitiesLogsClient.query('COMMIT');
          
          res.json({ message: 'Successfully bookmarked the post'});
        }else{
          res.json({message: 'failed to bookmark'});
        }
      } catch (error) {
        // Rollback the transaction if any error occurs
        await postsClient.query('ROLLBACK');
      
        console.error('Error voicing post:', error);
      
        // Send an error response to the profilesClient
        res.json({ message: 'Server error' });
      }    
    }else{
      res.json({
        'message': 'failed to bookmark post'
      })
    }
    
  } catch (error) {
    console.error('Error voicing post:', error);
    await postsClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.patch('/unbookmarkPost', async (req, res) => {
  const { 
    currentID,
    sender,
    postID,
  } = req.body;
  
  try {

    const deleteBookmarkFromTableQuery2 = `
      DELETE FROM bookmarks_list.posts WHERE user_id = $1 AND post_id = $2
    `;
    
    try {
      if(await userExists(sender) && !await isBlockedByUser(sender, currentID) && !await userIsPrivateAndNotFollowedByCurrentID(sender, currentID)){
        await postsClient.query('BEGIN');
        await postsClient.query(deleteBookmarkFromTableQuery2, [
          currentID, postID
        ]);
        await postsClient.query('COMMIT');
        
        res.json({ message: 'Successfully unbookmarked the post'});
      }else{
        res.json({message: 'failed to unbookmark'})
      }
    } catch (error) {
      // Rollback the transaction if any error occurs
      await postsClient.query('ROLLBACK');
    
      console.error('Error unvoicing post:', error);
    
      // Send an error response to the profilesClient
      res.json({ message: 'Server error' });
    }    
    
    
  } catch (error) {
    console.error('Error unvoicing post:', error);
    await postsClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.patch('/deletePost', async (req, res) => {
  const { 
    sender,
    postID,
  } = req.body;
  
  try {
    const insertDeletePostQuery = `
      UPDATE posts_list.posts_data
      SET deleted = ${JSON.stringify(true)}
      WHERE sender = $1 AND post_id = $2
    `;

    try {
      await postsClient.query('BEGIN');
      await postsClient.query(insertDeletePostQuery, [
        sender, postID
      ]);
      await postsClient.query('COMMIT');
      
      res.json({ message: 'Successfully deleted the post'});
    } catch (error) {
      // Rollback the transaction if any error occurs
      await profilesClient.query('ROLLBACK');
    
      console.error('Error deleting post:', error);
    
      // Send an error response to the profilesClient
      res.json({ message: 'Server error' });
    }    
    
  } catch (error) {
    console.error('Error deleting post:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.post('/uploadComment', async (req, res) => {
  const { 
    commentID,
    content,
    sender,
    mediasDatas,
    parentPostID,
    parentPostSender,
    parentPostType,
    hashtags,
    taggedUsers
  } = req.body;

  

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
      
    try {
      if(await userExists(parentPostSender) && !await isBlockedByUser(parentPostSender, sender)){
        await postsClient.query('BEGIN');
        await postsClient.query(insertCommentDataQuery, [
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
        await postsClient.query('COMMIT');

        await activitiesLogsClient.query('BEGIN');

        if(sender != parentPostSender){
          if(!await isBlockedByUser(sender, parentPostSender) && !await isMutedByUser(parentPostSender, sender)){
            await activitiesLogsClient.query(insertNewANotificationDataQuery, [
              'upload_comment', sender, parentPostSender, commentID, 'comment', new Date().toISOString()
            ]);
          }
        }

        for(var i = 0; i < taggedUsers.length; i++){
          var taggedUser = taggedUsers[i];
          if(taggedUser != sender){
            if(await userExists(taggedUser) && !await isBlockedByUser(taggedUser, sender) && !await userIsPrivateAndNotFollowedByCurrentID(taggedUser, sender)){
              const insertTaggedUserNotificationDataQuery = `
                INSERT INTO notifications_data.notifications_history (
                  type, sender, recipient, referenced_post_id, referenced_post_type, notified_time
                )
                VALUES ($1, $2, $3, $4, $5, $6)
              `;
              await activitiesLogsClient.query(insertTaggedUserNotificationDataQuery, [
                'tagged', sender, taggedUser, commentID, 'comment', new Date().toISOString()
              ])
            }
          }
        }
        await activitiesLogsClient.query('COMMIT');

        await keywordsClient.query('BEGIN');
        for(var i = 0; i < hashtags.length; i++){
          var hashtag = hashtags[i];
          await keywordsClient.query(insertUpdateHashtagQuery, [
            hashtag, 1
          ]);
        }
        await keywordsClient.query('COMMIT');

        
        res.json({ message: 'Successfully uploaded the comment'});
      }else{
        res.json({message: 'failed to comment'})
      }
    } catch (error) {
      // Rollback the transaction if any error occurs
      await postsClient.query('ROLLBACK');
    
      console.error('Error uploading comment:', error);
    
      // Send an error response to the postsClient
      res.json({ message: 'Server error' });
    }    
    
  } catch (error) {
    console.error('Error uploading post:', error);
    await postsClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.patch('/likeComment', async (req, res) => {
  const { 
    currentID,
    sender,
    commentID,
  } = req.body;
  
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
      if(await userExists(sender) && !await isBlockedByUser(sender, currentID) && !await userIsPrivateAndNotFollowedByCurrentID(sender, currentID)){
        await postsClient.query('BEGIN');
        await postsClient.query(insertLikeCommentQuery, [
          currentID, commentID
        ]);
        await postsClient.query('COMMIT');

        await activitiesLogsClient.query('BEGIN');

        if(sender != currentID){
          if(!await isBlockedByUser(currentID, sender) && !await isMutedByUser(sender, currentID)){
            await activitiesLogsClient.query(insertNewANotificationDataQuery, [
              'like', currentID, sender, commentID, 'comment', new Date().toISOString()
            ]);
          }
        }

        await activitiesLogsClient.query('COMMIT');
        
        res.json({ message: 'Successfully liked the comment'});
      }else{
        res.json({message: 'failed to like'})
      }
    } catch (error) {
      // Rollback the transaction if any error occurs
      await profilesClient.query('ROLLBACK');
    
      console.error('Error liking comment:', error);
    
      // Send an error response to the profilesClient
      res.json({ message: 'Server error' });
    }    
    
  } catch (error) {
    console.error('Error liking comment:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.patch('/unlikeComment', async (req, res) => {
  const { 
    currentID,
    sender,
    commentID,
  } = req.body;
  
  try {
    const insertUnlikeCommentQuery = `
      DELETE FROM likes_list.comments WHERE user_id = $1 AND comment_id = $2;
    `;

    try {
      if(await userExists(sender) && !await isBlockedByUser(sender, currentID) && !await userIsPrivateAndNotFollowedByCurrentID(sender, currentID)){
        await postsClient.query('BEGIN');
        await postsClient.query(insertUnlikeCommentQuery, [
          currentID, commentID
        ]);
        await postsClient.query('COMMIT');
        res.json({ message: 'Successfully unliked the comment'});
      }else{
        res.json({message: 'failed to unlike'})
      }
    } catch (error) {
      // Rollback the transaction if any error occurs
      await profilesClient.query('ROLLBACK');
    
      console.error('Error unliking comment:', error);
    
      // Send an error response to the profilesClient
      res.json({ message: 'Server error' });
    }    
    
  } catch (error) {
    console.error('Error unliking comment:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.patch('/bookmarkComment', async (req, res) => {
  const { 
    currentID,
    sender,
    commentID,
  } = req.body;
  
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
    const fetchCommentData = await postsClient.query(fetchCommentDataQuery, [
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

    if(commentDataList.length > 0){
      try {
        if(await userExists(sender) && !await isBlockedByUser(sender, currentID) && !await userIsPrivateAndNotFollowedByCurrentID(sender, currentID)){
          await postsClient.query('BEGIN');
          await postsClient.query(insertBookmarkCommentQuery, [currentID, commentID, sender, new Date()]);
          await postsClient.query('COMMIT');

          await activitiesLogsClient.query('BEGIN');

          if(sender != currentID){
            if(!await isBlockedByUser(currentID, sender) && !await isMutedByUser(sender, currentID)){
              await activitiesLogsClient.query(insertNewANotificationDataQuery, [
                'bookmark', currentID, sender, commentID, 'comment', new Date().toISOString()
              ]);
            }
          }

          await activitiesLogsClient.query('COMMIT');
          
          res.json({ message: 'Successfully bookmarked the comment'});
        }else{
          res.json({message: 'failed to bookmark'})
        }
      } catch (error) {
        // Rollback the transaction if any error occurs
        await postsClient.query('ROLLBACK');
      
        console.error('Error voicing comment:', error);
      
        // Send an error response to the profilesClient
        res.json({ message: 'Server error' });
      }    
    }else{
      res.json({
        'message': 'failed to bookmark comment'
      })
    }
    
  } catch (error) {
    console.error('Error voicing comment:', error);
    await postsClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.patch('/unbookmarkComment', async (req, res) => {
  const { 
    currentID,
    sender,
    commentID,
  } = req.body;
  
  try {

    const deleteBookmarkFromTableQuery2 = `
      DELETE FROM bookmarks_list.comments WHERE user_id = $1 AND comment_id = $2
    `;

    
    try {
      if(await userExists(sender) && !await isBlockedByUser(sender, currentID) && !await userIsPrivateAndNotFollowedByCurrentID(sender, currentID)){
        await postsClient.query('BEGIN');
        await postsClient.query(deleteBookmarkFromTableQuery2, [
          currentID, commentID
        ]);
        await postsClient.query('COMMIT');
        
        res.json({ message: 'Successfully unbookmarked the comment'});
      }else{
        res.json({message: 'failed to unbookmark'})
      }
    } catch (error) {
      // Rollback the transaction if any error occurs
      await postsClient.query('ROLLBACK');
    
      console.error('Error unvoicing comment:', error);
    
      // Send an error response to the profilesClient
      res.json({ message: 'Server error' });
    }    
    
    
  } catch (error) {
    console.error('Error unvoicing comment:', error);
    await postsClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.patch('/deleteComment', async (req, res) => {
  const { 
    sender,
    commentID  } = req.body;
  
  try {
    const insertDeleteCommentQuery = `
      UPDATE comments_list.comments_data
      SET deleted = ${JSON.stringify(true)}
      WHERE sender = $1 AND comment_id = $2
    `;
    try {
      await postsClient.query('BEGIN');
      await postsClient.query(insertDeleteCommentQuery, [
        sender,
        commentID
      ]);
      await postsClient.query('COMMIT');
      
      res.json({ message: 'Successfully deleted the comment'});
    } catch (error) {
      // Rollback the transaction if any error occurs
      await profilesClient.query('ROLLBACK');
    
      console.error('Error deleting comment:', error);
    
      // Send an error response to the profilesClient
      res.json({ message: 'Server error' });
    }    
    
  } catch (error) {
    console.error('Error deleting comment:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

async function followUser(followedID: String, followingID: String, filterPrivate: Boolean){
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

  try{
    var isPrivateAndNotFollowedBool = false;
    if(filterPrivate){
      isPrivateAndNotFollowedBool = await userIsPrivateAndNotFollowedByCurrentID(followedID, followingID);
    }
    if(await userExists(followedID) && !await isBlockedByUser(followedID, followingID) && !await isBlockedByUser(followingID, followedID) && !isPrivateAndNotFollowedBool){
      await profilesClient.query(insertUpdateFollowedUserSocialsQuery, [
        followingID, followedID, new Date()
      ]);
      await activitiesLogsClient.query('BEGIN');
      await activitiesLogsClient.query(insertNewANotificationDataQuery, [
        'follow', followingID, followedID, '', '', new Date().toISOString()
      ]);
      await activitiesLogsClient.query('COMMIT');

      
      return ({message: 'Successfully followed user'});
    }else{
      return ({message: 'User has been blocked'});
    }
  } catch (error) {
    // Rollback the transaction if any error occurs
    await profilesClient.query('ROLLBACK');
  
    console.error('Error following user:', error);
  
    // Send an error response to the profilesClient
  }   
}

async function sendFollowRequest(requestedID: String, requestingID: String){
  const insertUpdateCurrentUserRequestQuery = `
    INSERT INTO follow_requests_users.follow_request_history (requesting_id, requested_id, request_time)
    VALUES ($1, $2, $3)
  `;

  try{
    if(await userExists(requestedID) && !await isBlockedByUser(requestedID, requestingID) && !await isBlockedByUser(requestingID, requestedID)){
      await profilesClient.query('BEGIN');
      await profilesClient.query(insertUpdateCurrentUserRequestQuery, [
        requestingID, requestedID, new Date()
      ]);
      await profilesClient.query('COMMIT');
      
      return ({message: 'Successfully send request to user'});
    }else{
      return ({message: 'User has been blocked'});
    }
    
  } catch (error) {
    // Rollback the transaction if any error occurs
    await profilesClient.query('ROLLBACK');
  
    console.error('Error requested user:', error);
  }   
}



usersRoutes.patch('/followUser', async (req, res) => {
  const { 
    currentID,
    followedID,
  } = req.body;


  try{
    var followedUserBasicData = await getBasicUserProfileData(followedID);
    var message;
    await profilesClient.query('BEGIN');
    if(followedUserBasicData.private){
      
      message = await sendFollowRequest(followedID, currentID);
    }else{
      
      message = await followUser(followedID, currentID, true);
    }
    await profilesClient.query('COMMIT');

    res.json({message: message})
  } catch (error) {
    // Rollback the transaction if any error occurs
    await profilesClient.query('ROLLBACK');
  
    console.error('Error following user:', error);
  
    // Send an error response to the profilesClient
    res.json({ message: 'Server error' });
  }   

});

usersRoutes.patch('/unfollowUser', async (req, res) => {
  const { 
    currentID,
    followedID,
  } = req.body;

  try{
    const insertUpdateFollowedUserSocialsQuery = `DELETE FROM follow_users.follow_history WHERE following_id = $1 AND followed_id = $2;`;


    try{
      await profilesClient.query('BEGIN');
      await profilesClient.query(insertUpdateFollowedUserSocialsQuery, [
        currentID, followedID
      ]);
      await profilesClient.query('COMMIT');

      
      res.json({message: 'Successfully followed user'});
    } catch (error) {
      // Rollback the transaction if any error occurs
      await profilesClient.query('ROLLBACK');
    
      console.error('Error following user:', error);
    
      // Send an error response to the profilesClient
      res.json({ message: 'Server error' });
    }   
  } catch (error) {
    console.error('Error following user:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }

});

usersRoutes.get('/fetchUserProfileFollowers', async(req, res) => {
  const { 
    userID,
    currentID,
    currentLength,
    paginationLimit,
    maxFetchLimit
  } = req.body;
  
  try {
    const fetchUserProfileFollowersQuery = `SELECT * FROM public."fetch_user_followers"($1, $2, $3, $4)`;
    const fetchUserProfileFollowers = await profilesClient.query(fetchUserProfileFollowersQuery, [
      userID,
      currentID,
      currentLength,
      Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1)),
    ]);
    const userProfileFollowers = fetchUserProfileFollowers.rows.map((e) => e.user_id);
    
    const dataLength = userProfileFollowers.length;
    if(dataLength > paginationLimit){
      userProfileFollowers.pop();
    }
    
    var getCompleteUsersData = await getUsersListCompleteData(userProfileFollowers, currentID);
    const usersProfileData = getCompleteUsersData.usersProfileData;
    const usersSocialsData = getCompleteUsersData.usersSocialsData;

    res.json({
      message: "Successfully fetched data", usersProfileData: usersProfileData, 
      usersSocialsData, canPaginate: dataLength > paginationLimit,
    });
  } catch (error) {
    console.error('Error during fetching user followers:', error);
    res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchUserProfileFollowing', async(req, res) => {
  const { 
    userID,
    currentID,
    currentLength,
    paginationLimit ,
    maxFetchLimit
  } = req.body;
  
  try {
    const fetchUserProfileFollowingQuery = `SELECT * FROM public."fetch_user_following"($1, $2, $3, $4)`;
    const fetchUserProfileFollowing = await profilesClient.query(fetchUserProfileFollowingQuery, [
      userID,
      currentID,
      currentLength,
      Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1))
    ]);
    const userProfileFollowing = fetchUserProfileFollowing.rows.map((e) => e.user_id);
    
    const dataLength = userProfileFollowing.length;
    if(dataLength > paginationLimit){
      userProfileFollowing.pop();
    }
    
    var getCompleteUsersData = await getUsersListCompleteData(userProfileFollowing, currentID);
    const usersProfileData = getCompleteUsersData.usersProfileData;
    const usersSocialsData = getCompleteUsersData.usersSocialsData;

    res.json({
      message: "Successfully fetched data", usersProfileData: usersProfileData, 
      usersSocialsData, canPaginate: dataLength > paginationLimit,
    });

  } catch (error) {
    console.error('Error during fetching user following:', error);
    res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchSelectedPostComments', async(req, res) => {
  const { 
    sender,
    postID,
    currentID,
    currentLength,
    paginationLimit,
    maxFetchLimit
  } = req.body;
  try {
    

    const fetchSelectedPostDataQuery = `SELECT * FROM posts_list.posts_data WHERE sender = $1 AND post_id = $2`;
    const fetchSelectedPostData = await postsClient.query(fetchSelectedPostDataQuery, [sender, postID]);
    var selectedPostData = fetchSelectedPostData.rows[0];
    

    var getCompleteUsersData = await getUsersListCompleteData([sender], currentID);
    var usersProfileData = getCompleteUsersData.usersProfileData;
    var usersSocialsData = getCompleteUsersData.usersSocialsData;

    const selectedPostEngagementsData = await getPostEngagementsData(selectedPostData.post_id, selectedPostData.sender, currentID);
    selectedPostData = {...selectedPostData, ...selectedPostEngagementsData};

    const fetchPostCommentsQuery = `SELECT * FROM public."fetch_post_comments"($1, $2, $3, $4, $5, $6, $7, $8)`;
    const fetchPostComments = await postsClient.query(fetchPostCommentsQuery, [
      postID, currentID, currentLength, Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1)),
      username, IP, PORT, password
    ]);
    const postComments = fetchPostComments.rows.map((e) => e.post_data);
    
    const dataLength = postComments.length;
    if(dataLength > paginationLimit){
      postComments.pop();
    }

    var getCompletePostsData = await getPostsListCompleteData(postComments, currentID);
    const completePostsList = getCompletePostsData.completeDataList; 
    usersProfileData.push(...getCompletePostsData.usersProfileData);
    usersSocialsData.push(...getCompletePostsData.usersSocialsData);
    
    
    

    res.json({
      message: 'Successfully fetched data', usersProfileData: usersProfileData, 
      usersSocialsData: usersSocialsData, commentsData: completePostsList, 
      canPaginate: dataLength > paginationLimit, selectedPostData: selectedPostData
    });
  } catch (error) {
    console.error('Error fetching post data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchSelectedPostCommentsPagination', async(req, res) => {
  const { 
    postID,
    currentID,
    currentLength,
    paginationLimit,
    maxFetchLimit
  } = req.body;
  try {
    
    const fetchPostCommentsQuery = `SELECT * FROM public."fetch_post_comments"($1, $2, $3, $4, $5, $6, $7, $8)`;
    const fetchPostComments = await postsClient.query(fetchPostCommentsQuery, [
      postID, currentID, currentLength, Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1)),
      username, IP, PORT, password
    ]);
    const postComments = fetchPostComments.rows.map((e) => e.post_data);
    
    const dataLength = postComments.length;
    if(dataLength > paginationLimit){
      postComments.pop();
    }
    
    var getCompletePostsData = await getPostsListCompleteData(postComments, currentID);
    const completePostsList = getCompletePostsData.completeDataList; 
    const usersProfileData = getCompletePostsData.usersProfileData;
    const usersSocialsData = getCompletePostsData.usersSocialsData;

    
    res.json({
      message: 'Successfully fetched data', usersProfileData: usersProfileData, 
      usersSocialsData: usersSocialsData, commentsData: completePostsList,
      canPaginate: dataLength > paginationLimit
    });
  } catch (error) {
    console.error('Error fetching post data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchSelectedCommentComments', async(req, res) => {
  const { 
    sender,
    commentID,
    currentID,
    currentLength,
    paginationLimit,
    maxFetchLimit
  } = req.body;
  try {
    
    const fetchSelectedCommentDataQuery = `SELECT * FROM comments_list.comments_data WHERE sender = $1 AND comment_id = $2`;
    const fetchSelectedCommentData = await postsClient.query(fetchSelectedCommentDataQuery, [sender, commentID]);
    var selectedCommentData = fetchSelectedCommentData.rows[0];

    const selectedCommentEngagementsData = await getCommentEngagementsData(selectedCommentData.comment_id, selectedCommentData.sender, currentID);
    selectedCommentData = {...selectedCommentData, ...selectedCommentEngagementsData};

    var parentPostSender = selectedCommentData.parent_post_sender;
    var parentPostID = selectedCommentData.parent_post_id;
    var parentPostType = selectedCommentData.parent_post_type;

    
    var getCompleteUsersData = await getUsersListCompleteData([parentPostSender, sender], currentID);
    const usersProfileData = getCompleteUsersData.usersProfileData;
    const usersSocialsData = getCompleteUsersData.usersSocialsData;

    

    const fetchParentPostDataQuery = parentPostType == 'post' ?
      `SELECT * FROM posts_list.posts_data WHERE sender = $1 AND post_id = $2`
    : 
      `SELECT * FROM comments_list.comments_data WHERE sender = $1 AND comment_id = $2`;
    const fetchParentPostData = await postsClient.query(fetchParentPostDataQuery, [parentPostSender, parentPostID]);
    var parentPostData = fetchParentPostData.rows[0];
    const parentPostEngagementsData = parentPostType == 'post' ? 
      await getPostEngagementsData(parentPostData.post_id, parentPostData.sender, currentID)
    :
      await getCommentEngagementsData(parentPostData.comment_id, parentPostData.sender, currentID);

    parentPostData = {...parentPostData, ...parentPostEngagementsData};

    

    const fetchCommentCommentsQuery = `SELECT * FROM public."fetch_comment_comments"($1, $2, $3, $4, $5, $6, $7, $8)`;
    const fetchCommentComments = await postsClient.query(fetchCommentCommentsQuery, [
      commentID, currentID, currentLength, Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1)),
      username, IP, PORT, password
    ]);
    const commentComments = fetchCommentComments.rows.map((e) => e.post_data);
    
    const dataLength = commentComments.length;
    if(dataLength > paginationLimit){
      commentComments.pop();
    }
    
    var getCompletePostsData = await getPostsListCompleteData(commentComments, currentID);
    const completePostsList = getCompletePostsData.completeDataList; 
    usersProfileData.push(...getCompletePostsData.usersProfileData);
    usersSocialsData.push(...getCompletePostsData.usersSocialsData);
    
    

    res.json({
      message: 'Successfully fetched data', usersProfileData: usersProfileData, 
      usersSocialsData: usersSocialsData, commentsData: completePostsList, 
      canPaginate: dataLength > paginationLimit, parentPostData: parentPostData,
      selectedCommentData: selectedCommentData
    });
  } catch (error) {
    console.error('Error fetching comment data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchSelectedCommentCommentsPagination', async(req, res) => {
  const { 
    commentID,
    currentID,
    currentLength,
    paginationLimit,
    maxFetchLimit
  } = req.body;
  try {
    const fetchCommentCommentsQuery = `SELECT * FROM public."fetch_comment_comments"($1, $2, $3, $4, $5, $6, $7, $8)`;
    const fetchCommentComments = await postsClient.query(fetchCommentCommentsQuery, [
      commentID, currentID, currentLength, Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1)),
      username, IP, PORT, password
    ]);
    const commentComments = fetchCommentComments.rows.map((e) => e.post_data);
    const dataLength = commentComments.length;
    if(dataLength > paginationLimit){
      commentComments.pop();
    }
    
    var getCompletePostsData = await getPostsListCompleteData(commentComments, currentID);
    const completePostsList = getCompletePostsData.completeDataList; 
    const usersProfileData = getCompletePostsData.usersProfileData;
    const usersSocialsData = getCompletePostsData.usersSocialsData;
    
    
    
    res.json({
      message: 'Successfully fetched data', usersProfileData: usersProfileData, 
      usersSocialsData: usersSocialsData, commentsData: completePostsList,
      canPaginate: dataLength > paginationLimit
    });
  } catch (error) {
    console.error('Error fetching comment data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchSearchedPosts', async (req, res) => {
  const {
    searchedText,
    currentID,
    currentLength,
    paginationLimit,
    maxFetchLimit
  } = req.body;
  
  try{
    const fetchSearchedPostsDataQuery = `SELECT * FROM public."fetch_searched_posts"($1, $2, $3, $4, $5, $6, $7, $8)`;
    const fetchSearchedPostsData = await postsClient.query(fetchSearchedPostsDataQuery, [
      currentID, searchedText, currentLength, maxFetchLimit,
      username, IP, PORT, password
    ]);
    const searchedPosts = fetchSearchedPostsData.rows.map((e) => e.post_data);
    //
    const totalPostsLength = Math.min(maxFetchLimit, searchedPosts.length);
    
    var modifiedSearchedPosts = [...searchedPosts];
    modifiedSearchedPosts = modifiedSearchedPosts.slice(currentLength, currentLength + Math.min(searchedPosts.length - currentLength, paginationLimit));
    var getCompletePostsData = await getPostsListFilteredData(modifiedSearchedPosts, currentID);
    const completePostsList = getCompletePostsData.completeDataList; 
    const usersProfileData = getCompletePostsData.usersProfileData;
    const usersSocialsData = getCompletePostsData.usersSocialsData;

    

    
    res.json({
      'message': "Successfully fetched data",
      'usersProfileData': usersProfileData,
      'usersSocialsData': usersSocialsData,
      'searchedPosts': searchedPosts,
      'modifiedSearchedPosts': completePostsList,
      'totalPostsLength': totalPostsLength

    })
  } catch (error) {
    console.error('Error fetching user data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchSearchedPostsPagination', async (req, res) => {
  var {
    searchedPostsEncoded,
    currentID  } = req.body;

  try{
    var modifiedSearchedPosts = JSON.parse(searchedPostsEncoded);
    
    
    var getCompletePostsData = await getPostsListFilteredData(modifiedSearchedPosts, currentID);
    const completePostsList = getCompletePostsData.completeDataList; 
    const usersProfileData = getCompletePostsData.usersProfileData;
    const usersSocialsData = getCompletePostsData.usersSocialsData;
    
    
    res.json({
      'message': "Successfully fetched data",
      'usersProfileData': usersProfileData,
      'usersSocialsData': usersSocialsData,
      'modifiedSearchedPosts': completePostsList,

    })
  } catch (error) {
    console.error('Error fetching user data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchSearchedComments', async (req, res) => {
  const {
    searchedText,
    currentID,
    currentLength,
    paginationLimit,
    maxFetchLimit
  } = req.body;
  
  try{
    const fetchSearchedCommentsDataQuery = `SELECT * FROM public."fetch_searched_comments"($1, $2, $3, $4, $5, $6, $7, $8)`;
    const fetchSearchedCommentsData = await postsClient.query(fetchSearchedCommentsDataQuery, [
      currentID, searchedText, currentLength, maxFetchLimit,
      username, IP, PORT, password
    ]);
    const searchedComments = fetchSearchedCommentsData.rows.map((e) => e.post_data);
    const totalCommentsLength = Math.min(maxFetchLimit, searchedComments.length);
    

    var modifiedSearchedComments = [...searchedComments];
    modifiedSearchedComments = modifiedSearchedComments.slice(currentLength, currentLength + Math.min(searchedComments.length - currentLength, paginationLimit));
    
    var getCompletePostsData = await getPostsListFilteredData(modifiedSearchedComments, currentID);
    const completePostsList = getCompletePostsData.completeDataList; 
    const usersProfileData = getCompletePostsData.usersProfileData;
    const usersSocialsData = getCompletePostsData.usersSocialsData;

    
    
    res.json({
      'message': "Successfully fetched data",
      'usersProfileData': usersProfileData,
      'usersSocialsData': usersSocialsData,
      'searchedComments': searchedComments,
      'modifiedSearchedComments': completePostsList,
      'totalCommentsLength': totalCommentsLength

    })
  } catch (error) {
    console.error('Error fetching user data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchSearchedCommentsPagination', async (req, res) => {
  var {
    searchedCommentsEncoded,
    currentID  } = req.body;

  try{
    var modifiedSearchedComments = JSON.parse(searchedCommentsEncoded);
    
    var getCompletePostsData = await getPostsListFilteredData(modifiedSearchedComments, currentID);
    const completePostsList = getCompletePostsData.completeDataList; 
    const usersProfileData = getCompletePostsData.usersProfileData;
    const usersSocialsData = getCompletePostsData.usersSocialsData;
    

    
    res.json({
      'message': "Successfully fetched data",
      'usersProfileData': usersProfileData,
      'usersSocialsData': usersSocialsData,
      'modifiedSearchedComments': completePostsList,
    })
  } catch (error) {
    console.error('Error fetching user data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchSearchedUsers', async (req, res) => {
  const {
    searchedText,
    currentID,
    currentLength,
    paginationLimit,
    maxFetchLimit
  } = req.body;
  
  try{
    const fetchSearchedUsersDataQuery = `SELECT user_id FROM basic_data.user_profile WHERE name LIKE '%${searchedText}%' OR username LIKE '%${searchedText}%'`;
    const fetchSearchedUsersData = await profilesClient.query(fetchSearchedUsersDataQuery, []);
    var searchedUsersData : String[] = fetchSearchedUsersData.rows.map((e) => e.user_id);
    const totalUsersLength = searchedUsersData.length;
    searchedUsersData.sort((a, b) => a > b ? -1 : 1);
    searchedUsersData = searchedUsersData.slice(0, maxFetchLimit);
    var modifiedSearchedUsers = [...searchedUsersData];
    modifiedSearchedUsers = modifiedSearchedUsers.slice(currentLength, currentLength + Math.min(searchedUsersData.length - currentLength, paginationLimit));
    
    var getCompleteUsersData = await getUsersListCompleteData(modifiedSearchedUsers, currentID);
    const usersProfileData = getCompleteUsersData.usersProfileData;
    const usersSocialsData = getCompleteUsersData.usersSocialsData;
    
    res.json({
      'message': "Successfully fetched data",
      'usersProfileData': usersProfileData,
      'usersSocialsData': usersSocialsData,
      'searchedUsers': searchedUsersData,
      'totalUsersLength': totalUsersLength
    })
  } catch (error) {
    console.error('Error fetching user data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchSearchedUsersPagination', async (req, res) => {
  var {
    currentID,
    searchedUsersEncoded,
  } = req.body;

  try{
    var modifiedSearchedUsers = JSON.parse(searchedUsersEncoded);
    
    var getCompleteUsersData = await getUsersListCompleteData(modifiedSearchedUsers, currentID);
    const usersProfileData = getCompleteUsersData.usersProfileData;
    const usersSocialsData = getCompleteUsersData.usersSocialsData;
    
    
    res.json({
      'message': "Successfully fetched data",
      'usersProfileData': usersProfileData,
      'usersSocialsData': usersSocialsData,

    })
  } catch (error) {
    console.error('Error fetching user data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchUserNotifications', async (req, res) => {
  const {
    currentID,
    currentLength,
    paginationLimit,
    maxFetchLimit
  } = req.body;

  try{
    const fetchUserNotificationsDataQuery = `
      SELECT * FROM public."fetch_user_notifications"($1, $2, $3, $4, $5, $6, $7)
    `;

    const fetchUserNotificationsData = await activitiesLogsClient.query(fetchUserNotificationsDataQuery, [
      currentID, currentLength, Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1)),
      username, IP, PORT, password
    ]);
    var userNotificationsData = fetchUserNotificationsData.rows.map((e) => e.notification_data);
    
    const dataLength = userNotificationsData.length;
    if(dataLength > paginationLimit){
      userNotificationsData.pop();
    }

    var updatedNotificationsDataList = [];

    for(var i = 0; i < userNotificationsData.length; i++){
      var notificationData = userNotificationsData[i];
      var sender = notificationData.sender;
      var extraData = {
        content: '',
        medias_datas: '[]',
        sender_name: '',
        sender_profile_picture_link: '',
        parent_post_type: '',
        post_deleted: false
      }
      const fetchUserDataQuery = `SELECT * FROM basic_data.user_profile WHERE user_id = $1`;
      const fetchUserData = await profilesClient.query(fetchUserDataQuery, [sender]);
      const userData = fetchUserData.rows[0];
      extraData.sender_name = userData.name;
      extraData.sender_profile_picture_link = userData.profile_picture_link;
      if(notificationData.type == 'upload_comment'){
        const fetchCommentDataQuery = `SELECT * FROM comments_list.comments_data WHERE sender = $1 AND comment_id = $2`;
        const fetchCommentData = await postsClient.query(fetchCommentDataQuery, [sender, notificationData.referenced_post_id]);
        const commentData = fetchCommentData.rows[0];
        extraData.content = commentData.content;
        extraData.medias_datas = commentData.medias_datas;
        extraData.parent_post_type = commentData.parent_post_type;
        extraData.post_deleted = commentData.deleted;
      }else if(notificationData.type == 'tagged'){
        if(notificationData.referenced_post_type == 'post'){
          const fetchPostDataQuery = `SELECT * FROM posts_list.posts_data WHERE sender = $1 AND post_id = $2`;
          const fetchPostData = await postsClient.query(fetchPostDataQuery, [sender, notificationData.referenced_post_id]);
          const postData = fetchPostData.rows[0];
          extraData.content = postData.content;
          extraData.medias_datas = postData.medias_datas;
          extraData.post_deleted = postData.deleted;
        }else if(notificationData.referenced_post_type == 'comment'){
          const fetchCommentDataQuery = `SELECT * FROM comments_list.comments_data WHERE sender = $1 AND comment_id = $2`;
          const fetchCommentData = await postsClient.query(fetchCommentDataQuery, [sender, notificationData.referenced_post_id]);
          const commentData = fetchCommentData.rows[0];
          extraData.content = commentData.content;
          extraData.medias_datas = commentData.medias_datas;
          extraData.post_deleted = commentData.deleted;
        }
      }else if(notificationData.referenced_post_type == 'post'){
        const fetchPostDataQuery = `SELECT * FROM posts_list.posts_data WHERE sender = $1 AND post_id = $2`;
        const fetchPostData = await postsClient.query(fetchPostDataQuery, [currentID, notificationData.referenced_post_id]);
        const postData = fetchPostData.rows[0];
        
        
        extraData.content = postData.content;
        extraData.medias_datas = postData.medias_datas;
        extraData.post_deleted = postData.deleted;
      }else if(notificationData.referenced_post_type == 'comment'){
        const fetchCommentDataQuery = `SELECT * FROM comments_list.comments_data WHERE sender = $1 AND comment_id = $2`;
        const fetchCommentData = await postsClient.query(fetchCommentDataQuery, [currentID, notificationData.referenced_post_id]);
        const commentData = fetchCommentData.rows[0];
        extraData.content = commentData.content;
        extraData.medias_datas = commentData.medias_datas;
        extraData.post_deleted = commentData.deleted;
      }
      updatedNotificationsDataList.push({...notificationData, ...extraData});
    }

    res.json({
      message: 'Successfully fetched data',
      userNotificationsData: updatedNotificationsDataList,
      canPaginate: dataLength > paginationLimit
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchPostLikes', async (req, res) => {
  const {
    postID,
    currentID,
    currentLength,
    paginationLimit,
    maxFetchLimit
  } = req.body;

  try{
    const fetchPostLikesDataQuery = `SELECT * FROM public."fetch_post_likes"($1, $2, $3, $4, $5, $6, $7, $8)`;
    const fetchPostLikesData = await postsClient.query(fetchPostLikesDataQuery, [
      postID, 
      currentID,
      currentLength, 
      Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1)),
      username, IP, PORT, password
    ]);
    
    const postLikesData = fetchPostLikesData.rows.map((e) => e.user_id);
    
    const dataLength = postLikesData.length;
    if(dataLength > paginationLimit){
      postLikesData.pop();
    }
    
    var getCompleteUsersData = await getUsersListCompleteData(postLikesData, currentID);
    const usersProfileData = getCompleteUsersData.usersProfileData;
    const usersSocialsData = getCompleteUsersData.usersSocialsData;

    res.json({
      message: 'Successfully fetched data',
      usersProfileData: usersProfileData,
      usersSocialsData: usersSocialsData,
      canPaginate: dataLength > paginationLimit,
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchPostBookmarks', async (req, res) => {
  const {
    postID,
    currentID,
    currentLength,
    paginationLimit,
    maxFetchLimit
  } = req.body;

  try{
    const fetchPostBookmarksDataQuery = `SELECT * FROM public."fetch_post_bookmarks"($1, $2, $3, $4, $5, $6, $7, $8)`;
    const fetchPostBookmarksData = await postsClient.query(fetchPostBookmarksDataQuery, [
      postID,
      currentID,
      currentLength,
      Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1)),
      username, IP, PORT, password
    ]);
    const postBookmarksData = fetchPostBookmarksData.rows.map((e) => e.user_id);

    const dataLength = postBookmarksData.length;
    if(dataLength > paginationLimit){
      postBookmarksData.pop();
    }
    
    var getCompleteUsersData = await getUsersListCompleteData(postBookmarksData, currentID);
    const usersProfileData = getCompleteUsersData.usersProfileData;
    const usersSocialsData = getCompleteUsersData.usersSocialsData;

    res.json({
      message: 'Successfully fetched data',
      usersProfileData: usersProfileData,
      usersSocialsData: usersSocialsData,
      canPaginate: dataLength > paginationLimit,
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchCommentLikes', async (req, res) => {
  const {
    commentID,
    currentID,
    currentLength,
    paginationLimit,
    maxFetchLimit
  } = req.body;

  try{
    const fetchCommentLikesDataQuery = `SELECT * FROM public."fetch_comment_likes"($1, $2, $3, $4, $5, $6, $7, $8)`;
    const fetchCommentLikesData = await postsClient.query(fetchCommentLikesDataQuery, [
      commentID, 
      currentID,
      currentLength,
      Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1)),
      username, IP, PORT, password
    ]);
    const commentLikesData = fetchCommentLikesData.rows.map((e) => e.user_id);
    
    const dataLength = commentLikesData.length;
    if(dataLength > paginationLimit){
      commentLikesData.pop();
    }
    
    var getCompleteUsersData = await getUsersListCompleteData(commentLikesData, currentID);
    const usersProfileData = getCompleteUsersData.usersProfileData;
    const usersSocialsData = getCompleteUsersData.usersSocialsData;

    res.json({
      message: 'Successfully fetched data',
      usersProfileData: usersProfileData,
      usersSocialsData: usersSocialsData,
      canPaginate: dataLength > paginationLimit,
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchCommentBookmarks', async (req, res) => {
  const {
    commentID,
    currentID,
    currentLength,
    paginationLimit,
    maxFetchLimit
  } = req.body;

  try{
    const fetchCommentBookmarksDataQuery = `SELECT * FROM public."fetch_comment_bookmarks"($1, $2, $3, $4, $5, $6, $7, $8)`;
    const fetchCommentBookmarksData = await postsClient.query(fetchCommentBookmarksDataQuery, [
      commentID, 
      currentID,
      currentLength, 
      Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1)),
      username, IP, PORT, password
    ]);
    const commentBookmarksData = fetchCommentBookmarksData.rows.map((e) => e.user_id);

    const dataLength = commentBookmarksData.length;
    if(dataLength > paginationLimit){
      commentBookmarksData.pop();
    }
    
    var getCompleteUsersData = await getUsersListCompleteData(commentBookmarksData, currentID);
    const usersProfileData = getCompleteUsersData.usersProfileData;
    const usersSocialsData = getCompleteUsersData.usersSocialsData;

    res.json({
      message: 'Successfully fetched data',
      usersProfileData: usersProfileData,
      usersSocialsData: usersSocialsData,
      canPaginate: dataLength > paginationLimit,
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchSearchedTagUsers', async (req, res) => {
  const {
    searchedText,
    currentID,
    currentLength,
    paginationLimit
  } = req.body;
  
  try{
    const fetchSearchedUsersDataQuery = `SELECT user_id FROM public."fetch_searched_tag_users" ($1, $2, $3, $4)`;
    const fetchSearchedUsersData = await profilesClient.query(fetchSearchedUsersDataQuery, [
      searchedText, currentID, currentLength, paginationLimit
    ]);
    var searchedUsersData : String[] = fetchSearchedUsersData.rows.map((e) => e.user_id);    
    var getCompleteUsersData = await getUsersListBasicData(searchedUsersData, currentID);
    const usersProfileData = getCompleteUsersData.usersProfileData.map((e) => e.data.basic_data);
    
    
    res.json({
      'message': "Successfully fetched data",
      'usersProfileData': usersProfileData,
    })
  } catch (error) {
    console.error('Error fetching user data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchTopData', async (req, res) => {
  const {
    currentID,
    paginationLimit
  } = req.body;
  
  try{

    const fetchTopPostsQuery = `SELECT * FROM public."fetch_most_popular_posts"($1, $2, $3, $4, $5, $6)`;
    const fetchTopPosts = await postsClient.query(fetchTopPostsQuery, [
      currentID, paginationLimit,
      username, IP, PORT, password
    ]);
    const postsList : String[] = fetchTopPosts.rows.map((e) => e.post_data);
    var getCompletePostsData = await getPostsListFilteredData(postsList, currentID);
    const completePostsList = getCompletePostsData.completeDataList; 

    const fetchTopUsersQuery = `SELECT * FROM public."fetch_most_popular_users"($1, $2)`;
    const fetchTopUsers = await profilesClient.query(fetchTopUsersQuery, [currentID, paginationLimit]);
    const usersID : String[] = fetchTopUsers.rows.map((e) => e.user_id);
    var getCompleteUsersData = await getUsersListFilteredData(usersID, currentID);

    var combinedUsersID : any[] = [];
    var combinedUsersProfileData : any[] = [...getCompleteUsersData.usersProfileData, ...getCompletePostsData.usersProfileData];
    var combinedUsersSocialsData = [...getCompleteUsersData.usersSocialsData, ...getCompletePostsData.usersSocialsData];
    var filteredUsersProfileData = [];
    var filteredUsersSocialsData = [];
    
    for(var i = 0; i < combinedUsersProfileData.length; i++){
      if(!combinedUsersID.includes(combinedUsersProfileData[i].user_id)){
        combinedUsersID.push(combinedUsersProfileData[i].user_id);
        filteredUsersProfileData.push(combinedUsersProfileData[i]);
        filteredUsersSocialsData.push(combinedUsersSocialsData[i]);
      }
    }
    
    const usersProfileData = filteredUsersProfileData;
    const usersSocialsData = filteredUsersSocialsData;

    const fetchHashtagsDataQuery = `SELECT * FROM hashtags.hashtags_list ORDER BY hashtag_count DESC OFFSET $1 LIMIT $2`;
    const fetchHashtagsData = await keywordsClient.query(fetchHashtagsDataQuery, [0, paginationLimit]);
    const hashtagsData : String[] = fetchHashtagsData.rows;

    res.json({
      'message': "Successfully fetched hashtags data",
      'hashtagsData': hashtagsData,
      'usersProfileData': usersProfileData,
      'usersSocialsData': usersSocialsData,
      'postsData': completePostsList
    })
  } catch (error) {
    console.error('Error fetching hashtags data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.patch('/muteUser', async (req, res) => {
  const { 
    userID,
    currentID,
  } = req.body;

  try{
    const insertUpdateMutedUserSocialsQuery = `
      INSERT INTO muted_users.mute_history (user_id, muted_id)
      VALUES ($1, $2)
    `;

    try{
      if(await userExists(userID)){
        await profilesClient.query('BEGIN');
        await profilesClient.query(insertUpdateMutedUserSocialsQuery, [
          currentID,
          userID
        ]);
        await profilesClient.query('COMMIT');
        
        res.json({message: 'Successfully muted user'});
      }else{
        res.json({message: 'User doesnt exist'});
      }
    } catch (error) {
      // Rollback the transaction if any error occurs
      await profilesClient.query('ROLLBACK');
    
      console.error('Error muted user:', error);
    
      // Send an error response to the profilesClient
      res.json({ message: 'Server error' });
    }   
  } catch (error) {
    console.error('Error muted user:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }

});

usersRoutes.patch('/unmuteUser', async (req, res) => {
  const { 
    userID,
    currentID
  } = req.body;

  try{
    const insertUpdateMutedUserSocialsQuery = `DELETE FROM muted_users.mute_history WHERE user_id = $1 AND muted_id = $2;`;

    try{
      if(await userExists(userID)){
        await profilesClient.query('BEGIN');
        await profilesClient.query(insertUpdateMutedUserSocialsQuery, [
          currentID,
          userID
        ]);
        await profilesClient.query('COMMIT');

        
        res.json({message: 'Successfully unmuted user'});
      }else{
        res.json({message: 'User doesnt exist'});
      }
    } catch (error) {
      // Rollback the transaction if any error occurs
      await profilesClient.query('ROLLBACK');
    
      console.error('Error unmuting user:', error);
    
      // Send an error response to the profilesClient
      res.json({ message: 'Server error' });
    }   
  } catch (error) {
    console.error('Error unmuting user:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }

});

usersRoutes.patch('/blockUser', async (req, res) => {
  const { 
    userID,
    currentID,
  } = req.body;

  try{
    const insertUpdateBlockedUserSocialsQuery = `
      INSERT INTO blocked_users.block_history (user_id, blocked_id)
      VALUES ($1, $2)
    `;

    const deleteSocialsHistory = `DELETE FROM follow_users.follow_history WHERE following_id = $1 AND followed_id = $2;`;
    
    const deleteFollowRequestsHistory = `DELETE FROM follow_requests_users.follow_request_history WHERE requesting_id = $1 AND requested_id = $2;`
    try{
      if(await userExists(userID)){
        await profilesClient.query('BEGIN');
        await profilesClient.query(insertUpdateBlockedUserSocialsQuery, [currentID, userID]);
        await profilesClient.query(deleteSocialsHistory, [currentID, userID]);
        await profilesClient.query(deleteSocialsHistory, [userID, currentID]);

        await profilesClient.query(deleteFollowRequestsHistory, [currentID, userID]);
        await profilesClient.query(deleteFollowRequestsHistory, [userID, currentID]);
        await profilesClient.query('COMMIT');
        
        res.json({message: 'Successfully blocked user'});
      }else{
        res.json({message: 'User doenst exist'});
      }
    } catch (error) {
      // Rollback the transaction if any error occurs
      await profilesClient.query('ROLLBACK');
    
      console.error('Error blocked user:', error);
    
      // Send an error response to the profilesClient
      res.json({ message: 'Server error' });
    }   
  } catch (error) {
    console.error('Error blocked user:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }

});

usersRoutes.patch('/unblockUser', async (req, res) => {
  const { 
    userID,
    currentID
  } = req.body;

  try{
    const insertUpdateBlockedUserSocialsQuery = `DELETE FROM blocked_users.block_history WHERE user_id = $1 AND blocked_id = $2;`;

    try{
      if(await userExists(userID)){
        await profilesClient.query('BEGIN');
        await profilesClient.query(insertUpdateBlockedUserSocialsQuery, [
          currentID,
          userID
        ]);
        await profilesClient.query('COMMIT');

        
        res.json({message: 'Successfully unblocked user'});
      }else{
        res.json({message: 'User doesnt exist'});
      }
    } catch (error) {
      // Rollback the transaction if any error occurs
      await profilesClient.query('ROLLBACK');
    
      console.error('Error unblocking user:', error);
    
      // Send an error response to the profilesClient
      res.json({ message: 'Server error' });
    }   
  } catch (error) {
    console.error('Error unblocking user:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }

});

usersRoutes.patch('/lockAccount', async (req, res) => {
  const { 
    currentID
  } = req.body;

  try{
    const insertUserPrivateQuery = `
      UPDATE basic_data.user_profile
      SET private = $2
      WHERE user_id = $1
    `;

    try{
      await profilesClient.query('BEGIN');
      await profilesClient.query(insertUserPrivateQuery, [
        currentID, true
      ]);
      await profilesClient.query('COMMIT');

      
      res.json({message: 'Successfully locked user'});
    } catch (error) {
      // Rollback the transaction if any error occurs
      await profilesClient.query('ROLLBACK');
    
      console.error('Error locking user:', error);
    
      // Send an error response to the profilesClient
      res.json({ message: 'Server error' });
    }   
  } catch (error) {
    console.error('Error locking user:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }

});

usersRoutes.patch('/unlockAccount', async (req, res) => {
  const { 
    currentID
  } = req.body;
  
  try{
    const insertUserPrivateQuery = `
      UPDATE basic_data.user_profile
      SET private = $2
      WHERE user_id = $1
    `;
    const fetchAllRequestsToCurrentIDQuery = `SELECT requesting_id FROM follow_requests_users.follow_request_history WHERE requested_id = $1`;

    const removeAllRequestsToCurrentIDQuery = `DELETE FROM follow_requests_users.follow_request_history WHERE requested_id = $1`;

    try{
      const fetchAllRequestsToCurrentID = await profilesClient.query(fetchAllRequestsToCurrentIDQuery, [
        currentID
      ]);
      const allRequestsToCurrentID = fetchAllRequestsToCurrentID.rows.map((e) => e.requesting_id);

      await profilesClient.query('BEGIN');
      await profilesClient.query(insertUserPrivateQuery, [
        currentID, false
      ]);
      await profilesClient.query(removeAllRequestsToCurrentIDQuery, [
        currentID
      ]);

      for(var i = 0; i < allRequestsToCurrentID.length; i++){
        var userID = allRequestsToCurrentID[i];
        
        const removeCurrentIDFromRequestFromQuery = `DELETE FROM follow_requests_users.follow_request_history WHERE requesting_id = $1 AND requested_id = $2`;
        await profilesClient.query(removeCurrentIDFromRequestFromQuery, [userID, currentID]);
        followUser(currentID, userID, false);
      }

      await profilesClient.query('COMMIT');

      
      res.json({message: 'Successfully unlocked user'});
    } catch (error) {
      // Rollback the transaction if any error occurs
      await profilesClient.query('ROLLBACK');
    
      console.error('Error unlocking user:', error);
    
      // Send an error response to the profilesClient
      res.json({ message: 'Server error' });
    }   
  } catch (error) {
    console.error('Error unlocking user:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }

});

usersRoutes.patch('/cancelFollowRequest', async (req, res) => {
  const { 
    userID,
    currentID,
  } = req.body;

  try{
    const deleteFollowRequestQuery = `DELETE FROM follow_requests_users.follow_request_history WHERE requesting_id = $1 AND requested_id = $2;`;

    try{
      if(await userExists(userID)){
        await profilesClient.query('BEGIN');
        await profilesClient.query(deleteFollowRequestQuery, [
          currentID, userID
        ]);
        await profilesClient.query('COMMIT');
        
        res.json({message: 'Successfully cancelled user'});
      }else{
        res.json({message: 'User doesnt exist'});
      }
    } catch (error) {
      // Rollback the transaction if any error occurs
      await profilesClient.query('ROLLBACK');
    
      console.error('Error cancelled user:', error);
    
      // Send an error response to the profilesClient
      res.json({ message: 'Server error' });
    }   
  } catch (error) {
    console.error('Error cancelled user:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }

});

usersRoutes.patch('/rejectFollowRequest', async (req, res) => {
  const { 
    userID,
    currentID,
  } = req.body;

  try{
    const deleteFollowRequestQuery = `DELETE FROM follow_requests_users.follow_request_history WHERE requesting_id = $1 AND requested_id = $2;`;

    try{
      if(await userExists(userID)){
        await profilesClient.query('BEGIN');
        await profilesClient.query(deleteFollowRequestQuery, [
          userID, currentID
        ]);
        await profilesClient.query('COMMIT');
        
        res.json({message: 'Successfully rejectled user'});
      }else{
        res.json({message: 'User doesnt exist'});
      }
    } catch (error) {
      // Rollback the transaction if any error occurs
      await profilesClient.query('ROLLBACK');
    
      console.error('Error rejectled user:', error);
    
      // Send an error response to the profilesClient
      res.json({ message: 'Server error' });
    }   
  } catch (error) {
    console.error('Error rejectled user:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }

});

usersRoutes.patch('/acceptFollowRequest', async (req, res) => {
  const { 
    userID,
    currentID,
  } = req.body;

  try{
    const deleteFollowRequestQuery = `DELETE FROM follow_requests_users.follow_request_history WHERE requesting_id = $1 AND requested_id = $2;`;

    try{
      if(await userExists(userID)){
        await profilesClient.query('BEGIN');
        await profilesClient.query(deleteFollowRequestQuery, [
          userID, currentID
        ]);
        followUser(currentID, userID, false);
        
        await profilesClient.query('COMMIT');
        
        res.json({message: 'Successfully accepted user'});
      }else{
        res.json({message: 'User doesnt exist'});
      }
    } catch (error) {
      // Rollback the transaction if any error occurs
      await profilesClient.query('ROLLBACK');
    
      console.error('Error accepted user:', error);
    
      // Send an error response to the profilesClient
      res.json({ message: 'Server error' });
    }   
  } catch (error) {
    console.error('Error accepted user:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }

});

usersRoutes.get('/fetchFollowRequestsFromUser', async(req, res) => {
  const { 
    currentID,
    currentLength,
    paginationLimit ,
    maxFetchLimit
  } = req.body;
  
  try {
    const fetchUserProfileFollowRequestsFromQuery = `SELECT * FROM public."fetch_follow_requests_from"($1, $2, $3)`;
    const fetchUserProfileFollowRequestsFrom = await profilesClient.query(fetchUserProfileFollowRequestsFromQuery, [
      currentID,
      currentLength,
      Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1))
    ]);
    const userProfileFollowRequestsFrom = fetchUserProfileFollowRequestsFrom.rows.map((e) => e.user_id);
    
    const dataLength = userProfileFollowRequestsFrom.length;
    if(dataLength > paginationLimit){
      userProfileFollowRequestsFrom.pop();
    }

    var usersProfileData = [];
    var usersSocialsData = [];
    
    for(var i = 0; i < userProfileFollowRequestsFrom.length; i++){
      var userID = userProfileFollowRequestsFrom[i];
      var userProfileData = await getRequesterProfileData(userID, currentID, RequestType.From);
      usersProfileData.push(userProfileData.data.basic_data);
      usersSocialsData.push(userProfileData.data.socials_data);
    }

    res.json({
      message: "Successfully fetched data", usersProfileData: usersProfileData, 
      usersSocialsData: usersSocialsData, canPaginate: dataLength > paginationLimit,
    });
  } catch (error) {
    console.error('Error during fetching follow requests from user:', error);
    res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchFollowRequestsToUser', async(req, res) => {
  const { 
    currentID,
    currentLength,
    paginationLimit,
    maxFetchLimit
  } = req.body;
  
  try {
    const fetchUserProfilefollowRequestsToQuery = `SELECT * FROM public."fetch_follow_requests_to"($1, $2, $3)`;
    const fetchUserProfilefollowRequestsTo = await profilesClient.query(fetchUserProfilefollowRequestsToQuery, [
      currentID,
      currentLength,
      Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1))
    ]);
    const userProfileFollowRequestsTo = fetchUserProfilefollowRequestsTo.rows.map((e) => e.user_id);
    
    const dataLength = userProfileFollowRequestsTo.length;
    if(dataLength > paginationLimit){
      userProfileFollowRequestsTo.pop();
    }
    
    var usersProfileData = [];
    var usersSocialsData = [];
    
    for(var i = 0; i < userProfileFollowRequestsTo.length; i++){
      var userID = userProfileFollowRequestsTo[i];
      var userProfileData = await getRequesterProfileData(userID, currentID, RequestType.To);
      usersProfileData.push(userProfileData.data.basic_data);
      usersSocialsData.push(userProfileData.data.socials_data);
    }

    res.json({
      message: "Successfully fetched data", usersProfileData: usersProfileData, 
      usersSocialsData: usersSocialsData, canPaginate: dataLength > paginationLimit,
    });
  } catch (error) {
    console.error('Error during fetching follow requests to user:', error);
    res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchUserChats', async(req, res) => {
  const {
    userID,
    currentLength,
    paginationLimit,
    maxFetchLimit
  } = req.body;

  const fetchUserChatsDataQuery = `
    SELECT * FROM public."fetch_user_chats" ($1, $2, $3, $4, $5, $6, $7)
  `;
  const fetchUserChatsData = await chatsClient.query(fetchUserChatsDataQuery, [
    userID,
    currentLength,
    Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1)), 
    username, IP, PORT, password
  ]);
  const chatsData = fetchUserChatsData.rows.map((e) => e.chat_data);

  const dataLength = chatsData.length;
  if(dataLength > paginationLimit){
    chatsData.pop();
  }

  var recipientsProfileData = [];
  var recipientsSocialsData = [];
  var recipientsID = [];

  if(chatsData.length > 0){
    var currentCompleteData = await getCompleteUserProfileData(userID, userID);
    recipientsProfileData.push(currentCompleteData.data.basic_data);
    recipientsSocialsData.push(currentCompleteData.data.socials_data);
    recipientsID.push(userID);
  }

  for(var i = 0; i < chatsData.length; i++){
    var chatID : String = chatsData[i].chat_id;
    var type : String = chatsData[i].type;

    if(type == 'private'){
      var recipient : String = chatsData[i].recipient;
      if(!recipientsID.includes(recipient)){
        var recipientCompleteData = await getCompleteUserProfileData(recipient, userID);;
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
      const fetchLatestMessageData = await chatsClient.query(fetchLatestMessageDataQuery, [chatID, userID]);
      
      if(fetchLatestMessageData.rowCount > 0){
        const latestMessageData = fetchLatestMessageData.rows[0];
        chatsData[i].latest_message_upload_time = latestMessageData.upload_time;
        chatsData[i].latest_message_id = latestMessageData.message_id;
        chatsData[i].latest_message_content = latestMessageData.content;
        chatsData[i].latest_message_type = latestMessageData.type;
        chatsData[i].latest_message_sender = latestMessageData.sender;
      }else{
        chatsData[i].latest_message_content = '';
        chatsData[i].latest_message_upload_time = '';
        chatsData[i].latest_message_id = '';
        chatsData[i].latest_message_type = '';
        chatsData[i].latest_message_sender = '';
      }
    }else if(type == 'group'){
      const fetchLatestMessageDataQuery = `
        SELECT * FROM group_messages.messages_history
        WHERE chat_id = $1 AND NOT $2 = ANY(deleted_list)
        ORDER BY upload_time DESC
        LIMIT 1
      `;
      const fetchLatestMessageData = await chatsClient.query(fetchLatestMessageDataQuery, [chatID, userID]);
      if(fetchLatestMessageData.rowCount > 0){
        const latestMessageData = fetchLatestMessageData.rows[0];
        
        chatsData[i].latest_message_upload_time = latestMessageData.upload_time;
        chatsData[i].latest_message_id = latestMessageData.message_id;
        chatsData[i].latest_message_content = latestMessageData.content;
        chatsData[i].latest_message_type = latestMessageData.type;
        chatsData[i].latest_message_sender = latestMessageData.sender;
        
        var senderID : String = latestMessageData.sender;
        if(!recipientsID.includes(senderID)){
          var userCompleteData = await getCompleteUserProfileData(senderID, userID);
          recipientsProfileData.push(userCompleteData.data.basic_data);
          recipientsSocialsData.push(userCompleteData.data.socials_data);
          recipientsID.push(senderID);
        }
        if(latestMessageData.type.includes('add_users_to_group')){
          var addedUserID : String = latestMessageData.type.replace('add_users_to_group_', '');
          if(!recipientsID.includes(addedUserID)){
            var userCompleteData = await getCompleteUserProfileData(addedUserID, userID);
            recipientsProfileData.push(userCompleteData.data.basic_data);
            recipientsSocialsData.push(userCompleteData.data.socials_data);
            recipientsID.push(addedUserID);
          }
        }
      }else{
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
      const fetchGroupProfileData = await chatsClient.query(fetchGroupProfileDataQuery, [chatID]);
      const groupProfileData = fetchGroupProfileData.rows[0];
      chatsData[i].group_profile_data = groupProfileData;
      chatsData[i].members = groupProfileData.members;
    }
  }

  


  res.json({
    message: 'Successfully fetched data',
    userChatsData: chatsData,
    recipientsProfileData: recipientsProfileData,
    recipientsSocialsData: recipientsSocialsData,
    canPaginate: dataLength > paginationLimit
  });
});

usersRoutes.get('/fetchPrivateChat', async(req, res) => {
  var {
    chatID,
    currentID, 
    recipient,
    currentLength,
    paginationLimit,
    maxFetchLimit
  } = req.body;
  
  var privateChatData = null;

  try{
    if(await userExists(recipient) && !await isBlockedByUser(currentID, recipient) && !await isBlockedByUser(recipient, currentID)){
      var currentCompleteData = await getCompleteUserProfileData(currentID, currentID);
      var recipientCompleteData = await getCompleteUserProfileData(recipient, currentID);
      var membersProfileData = [
        currentCompleteData.data.basic_data, recipientCompleteData.data.basic_data
      ];
      var membersSocialsData = [
        currentCompleteData.data.socials_data, recipientCompleteData.data.socials_data
      ];
      if(chatID == null){
        
        const fetchChatDataQuery = `
          SELECT * FROM users_chats.chats_history
          WHERE user_id = $1 AND recipient = $2
        `;
        const fetchChatData = await chatsClient.query(fetchChatDataQuery, [
          currentID, recipient
        ]);
        const chatData = fetchChatData.rows[0];
        
        if(chatData == undefined){
          res.json({
            'message': 'Chat history not found',
            'chatID': null,
            'messagesData': [],
            'membersProfileData': membersProfileData,
            'membersSocialsData': membersSocialsData,
            'canPaginate': false
          });
        }else{
          chatID = chatData.chat_id;
        }
      }

      if(chatID != null || chatID != undefined){

        

        const fetchPrivateChatDataQuery = `
          SELECT * FROM private_messages.messages_history
          WHERE chat_id = $1 AND NOT $2 = ANY(deleted_list)
          ORDER BY upload_time DESC
          OFFSET $3 LIMIT $4
        `;
        const fetchPrivateChatData = await chatsClient.query(fetchPrivateChatDataQuery, [
          chatID,
          currentID,
          currentLength,
          Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1))
        ]);
        privateChatData = fetchPrivateChatData.rows;
        
        const dataLength = privateChatData.length;
        if(dataLength > paginationLimit){
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
    }else{
      res.json({
        'message': 'blacklisted'
      })
    }
  } catch (error) {
    console.error('Internal error inserting chat data:', error);
    await chatsClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }

  
});

usersRoutes.get('/fetchPrivateChatPagination', async(req, res) => {
  var {
    chatID,
    currentID, 
    recipient,
    currentLength,
    paginationLimit,
    maxFetchLimit
  } = req.body;
  
  var privateChatData = null;

  try{
    if(await userExists(recipient) && !await isBlockedByUser(currentID, recipient) && !await isBlockedByUser(recipient, currentID)){
      const fetchPrivateChatDataQuery = `
        SELECT * FROM private_messages.messages_history
        WHERE chat_id = $1 AND NOT $2 = ANY(deleted_list)
        ORDER BY upload_time DESC
        OFFSET $3 LIMIT $4
      `;
      const fetchPrivateChatData = await chatsClient.query(fetchPrivateChatDataQuery, [
        chatID,
        currentID,
        currentLength,
        Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1))
      ]);
      privateChatData = fetchPrivateChatData.rows;
      
      const dataLength = privateChatData.length;
      if(dataLength > paginationLimit){
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
    }else{
      res.json({
        'message': 'blacklisted'
      })
    }
  } catch (error) {
    console.error('Internal error inserting chat data:', error);
    await chatsClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }

  
});

usersRoutes.post('/sendPrivateMessage', async(req, res) => {
  const {
    chatID,
    newChatID,
    messageID,
    content,
    sender,
    recipient,
    mediasDatas,
  } = req.body;

  try{
    
    if(await userExists(recipient) && !await isBlockedByUser(sender, recipient) && !await isBlockedByUser(recipient, sender)){
      if(chatID == null){

        const insertCurrentUserChatTableQuery = `
          INSERT INTO users_chats.chats_history(
            user_id, chat_id, type, recipient, deleted
          )
          VALUES ($1, $2, $3, $4, $5)
        `;
        await chatsClient.query(insertCurrentUserChatTableQuery, [sender, newChatID, 'private', recipient, false]);
        const insertRecipientUserChatTableQuery = `
          INSERT INTO users_chats.chats_history(
            user_id, chat_id, type, recipient, deleted
          )
          VALUES ($1, $2, $3, $4, $5)
        `;
        await chatsClient.query(insertRecipientUserChatTableQuery, [recipient, newChatID, 'private', sender, false]);

        const insertCurrentUserChatQuery = `
          INSERT INTO private_messages.messages_history(
            chat_id, message_id, type, content, sender, upload_time, medias_datas, deleted_list
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        await chatsClient.query(insertCurrentUserChatQuery, [
          newChatID, messageID, 'message', content, sender, new Date().toISOString(), JSON.stringify(mediasDatas), 
          []
        ]);
      }else{
        const insertCurrentUserChatQuery = `
          INSERT INTO private_messages.messages_history(
            chat_id, message_id, type, content, sender, upload_time, medias_datas, deleted_list
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        await chatsClient.query(insertCurrentUserChatQuery, [
          chatID, messageID, 'message', content, sender, new Date().toISOString(), 
          JSON.stringify(mediasDatas), []
        ]);

        const updateCurrentUserChatTableQuery = `
          UPDATE users_chats.chats_history
          SET deleted = $1
          WHERE user_id = $2 AND chat_id = $3
        `;
        await chatsClient.query(updateCurrentUserChatTableQuery, [false, sender, chatID]);

        const updateRecipientUserChatTableQuery = `
          UPDATE users_chats.chats_history
          SET deleted = $1
          WHERE user_id = $2 AND chat_id = $3
        `;
        await chatsClient.query(updateRecipientUserChatTableQuery, [false, recipient, chatID]);
      }

      res.json({
        'message': 'Successfully sent message'
      })
    }else{
      res.json({
        'message': 'Failed to message'
      })
    }
  } catch (error) {
    console.error('Internal error inserting chat data:', error);
    await chatsClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.patch('/deletePrivateChat', async(req, res) => {
  const {
    chatID,
    currentID,
  } = req.body;

  try{
    const deleteAllMessagesQuery = `
      UPDATE private_messages.messages_history
      SET deleted_list = array_append(deleted_list, $1)
      WHERE chat_id = $2
    `;
    await chatsClient.query(deleteAllMessagesQuery, [currentID, chatID]);

    const deletePrivateChatQuery = `
      UPDATE users_chats.chats_history
      SET deleted = $1
      WHERE user_id = $2 AND chat_id = $3
    `;
    await chatsClient.query(deletePrivateChatQuery, [
      true, currentID, chatID
    ]);

    res.json({
      'message': 'Successfully deleted private chat'
    })
  } catch (error) {
    console.error('Internal error:', error);
    await chatsClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.patch('/deletePrivateMessage', async(req, res) => {
  const {
    messageID,
    currentID
  } = req.body;

  try{
    const deleteMessageQuery = `
      UPDATE private_messages.messages_history
      SET deleted_list = array_append(deleted_list, $1)
      WHERE message_id = $2
    `;
    await chatsClient.query(deleteMessageQuery, [currentID, messageID]);

    res.json({
      'message': 'Successfully deleted private message'
    })
  } catch (error) {
    console.error('Internal error:', error);
    await chatsClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.patch('/deletePrivateMessageForAll', async(req, res) => {
  const {
    messageID,
    currentID,
    recipient
  } = req.body;

  try{
    var members = [currentID, recipient];
    const deleteMessageQuery = `
      UPDATE private_messages.messages_history
      SET deleted_list = array_cat(deleted_list, $1)
      WHERE message_id = $2
    `;
    await chatsClient.query(deleteMessageQuery, [members, messageID]);

    res.json({
      'message': 'Successfully deleted private message'
    })
  } catch (error) {
    console.error('Internal error:', error);
    await chatsClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchSearchedChatUsers', async (req, res) => {
  const {
    searchedText,
    currentID,
    currentLength,
    paginationLimit
  } = req.body;
  
  try{
    const fetchSearchedUsersDataQuery = `SELECT user_id FROM public."fetch_searched_chat_users" ($1, $2, $3, $4)`;
    const fetchSearchedUsersData = await profilesClient.query(fetchSearchedUsersDataQuery, [
      searchedText, currentID, currentLength, paginationLimit
    ]);
    var searchedUsersData : String[] = fetchSearchedUsersData.rows.map((e) => e.user_id);
    
    var getCompleteUsersData = await getUsersListBasicData(searchedUsersData, currentID);
    const usersProfileData = getCompleteUsersData.usersProfileData.map((e) => e.data.basic_data);
    
    
    
    res.json({
      'message': "Successfully fetched data",
      'usersProfileData': usersProfileData,
    })
  } catch (error) {
    console.error('Error fetching user data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchGroupChat', async(req, res) => {
  var {
    chatID,
    currentID, 
    currentLength,
    paginationLimit,
    maxFetchLimit
  } = req.body;
  
  try{
    

    var membersProfileData : any = [];
    var membersSocialsData : any = [];
    var membersIDs : String[] = [];

    const fetchGroupProfileDataQuery = `
      SELECT * FROM group_profile.group_info
      WHERE chat_id = $1
    `;
    const fetchGroupProfileData = await chatsClient.query(fetchGroupProfileDataQuery, [
      chatID
    ]);
    var groupProfileData = fetchGroupProfileData.rows[0];

    const fetchGroupChatDataQuery = `
      SELECT * FROM group_messages.messages_history
      WHERE chat_id = $1 AND NOT $2 = ANY(deleted_list)
      ORDER BY upload_time DESC
      OFFSET $3 LIMIT $4
    `;
    const fetchGroupChatData = await chatsClient.query(fetchGroupChatDataQuery, [
      chatID,
      currentID,
      currentLength,
      Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1))
    ]);
    var groupChatData = fetchGroupChatData.rows;

    const dataLength = groupChatData.length;
    if(dataLength > paginationLimit){
      groupChatData.pop();
    }

    for(var i = 0; i < groupChatData.length; i++){
      var recipient = groupChatData[i].sender;
      if(!membersIDs.includes(recipient)){
        membersIDs.push(recipient);
        var recipientCompleteData = await getCompleteUserProfileData(recipient, currentID);
        membersProfileData.push(recipientCompleteData.data.basic_data);
        membersSocialsData.push(recipientCompleteData.data.socials_data);
      }
      if(groupChatData[i].type.includes('add_users_to_group')){
        var addedUserID : String = groupChatData[i].type.replace('add_users_to_group_', '');
        if(!membersIDs.includes(addedUserID)){
          var userCompleteData = await getCompleteUserProfileData(addedUserID, currentID);
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
    const fetchGroupChatMembers = await chatsClient.query(fetchGroupChatMembersQuery, [chatID]);
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
  } catch (error) {
    console.error('Internal error inserting chat data:', error);
    await chatsClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }

  
});

usersRoutes.get('/fetchGroupChatPagination', async(req, res) => {
  var {
    chatID,
    currentID, 
    currentLength,
    paginationLimit,
    maxFetchLimit
  } = req.body;
  
  try{
    

    var membersProfileData : any = [];
    var membersSocialsData : any = [];
    var membersIDs : String[] = [];

    const fetchGroupChatDataQuery = `
      SELECT * FROM group_messages.messages_history
      WHERE chat_id = $1 AND NOT $2 = ANY(deleted_list)
      ORDER BY upload_time DESC
      OFFSET $3 LIMIT $4
    `;
    const fetchGroupChatData = await chatsClient.query(fetchGroupChatDataQuery, [
      chatID,
      currentID,
      currentLength,
      Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit + 1))
    ]);
    var groupChatData = fetchGroupChatData.rows;

    const dataLength = groupChatData.length;
    if(dataLength > paginationLimit){
      groupChatData.pop();
    }

    for(var i = 0; i < groupChatData.length; i++){
      var recipient = groupChatData[i].sender;
      if(!membersIDs.includes(recipient)){
        membersIDs.push(recipient);
        var recipientCompleteData = await getCompleteUserProfileData(recipient, currentID);
        membersProfileData.push(recipientCompleteData.data.basic_data);
        membersSocialsData.push(recipientCompleteData.data.socials_data);
      }
      if(groupChatData[i].type.includes('add_users_to_group')){
        var addedUserID : String = groupChatData[i].type.replace('add_users_to_group_', '');
        if(!membersIDs.includes(addedUserID)){
          var userCompleteData = await getCompleteUserProfileData(addedUserID, currentID);
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
  } catch (error) {
    console.error('Internal error inserting chat data:', error);
    await chatsClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }

  
});

usersRoutes.post('/sendGroupMessage', async(req, res) => {
  var {
    chatID,
    newChatID,
    messageID,
    content,
    sender,
    recipients,
    mediasDatas,
  } = req.body;

  try{
    if(chatID == null){

      const insertCurrentUserChatQuery = `
        INSERT INTO group_messages.messages_history(
          chat_id, message_id, type, content, sender, upload_time, medias_datas, deleted_list
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      await chatsClient.query(insertCurrentUserChatQuery, [
        newChatID, messageID, 'message', content, sender, new Date().toISOString(), JSON.stringify(mediasDatas), 
        []
      ]);

      const insertGroupProfileQuery = `
        INSERT INTO group_profile.group_info(
          chat_id, name, profile_pic_link, description, members
        )
        VALUES ($1, $2, $3, $4, $5)
      `;
      await chatsClient.query(insertGroupProfileQuery, [
        newChatID,
        `Group ${newChatID}`,
        'https://as2.ftcdn.net/v2/jpg/03/13/82/51/1000_F_313825184_EpuEFYiODvG1lvqfKN2uIVAceAV5T0OX.jpg',
        '', recipients
      ]);

      for(var i = 0; i < recipients.length; i++){
        var recipient = recipients[i];
        const insertRecipientUserChatTableQuery = `
          INSERT INTO users_chats.chats_history(
            user_id, chat_id, type, recipient, deleted
          )
          VALUES ($1, $2, $3, $4, $5)
        `;
        await chatsClient.query(insertRecipientUserChatTableQuery, [recipient, newChatID, 'group', '', false]);
      }
    }else{
      const insertCurrentUserChatQuery = `
        INSERT INTO group_messages.messages_history(
          chat_id, message_id, type, content, sender, upload_time, medias_datas, deleted_list
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      await chatsClient.query(insertCurrentUserChatQuery, [
        chatID, messageID, 'message', content, sender, new Date().toISOString(), 
        JSON.stringify(mediasDatas), []
      ]);

      for(var i = 0; i < recipients.length; i++){
        var recipient = recipients[i];
        const updateRecipientUserChatTableQuery = `
          UPDATE users_chats.chats_history
          SET deleted = $1
          WHERE user_id = $2 AND chat_id = $3
        `;
        await chatsClient.query(updateRecipientUserChatTableQuery, [false, recipient, chatID]);
      }
    }

    res.json({
      'message': 'Successfully sent message'
    })
  } catch (error) {
    console.error('Internal error inserting chat data:', error);
    await chatsClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.patch('/deleteGroupChat', async(req, res) => {
  const {
    chatID,
    currentID,
  } = req.body;

  try{
    const deleteAllMessagesQuery = `
      UPDATE group_messages.messages_history
      SET deleted_list = array_append(deleted_list, $1)
      WHERE chat_id = $2
    `;
    await chatsClient.query(deleteAllMessagesQuery, [currentID, chatID]);

    const deleteGroupChatQuery = `
      UPDATE users_chats.chats_history
      SET deleted = $1
      WHERE user_id = $2 AND chat_id = $3
    `;
    await chatsClient.query(deleteGroupChatQuery, [
      true, currentID, chatID
    ]);

    res.json({
      'message': 'Successfully deleted group chat'
    })
  } catch (error) {
    console.error('Internal error:', error);
    await chatsClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.patch('/deleteGroupMessage', async(req, res) => {
  const {
    messageID,
    currentID
  } = req.body;

  try{
    const deleteMessageQuery = `
      UPDATE group_messages.messages_history
      SET deleted_list = array_append(deleted_list, $1)
      WHERE message_id = $2
    `;
    await chatsClient.query(deleteMessageQuery, [currentID, messageID]);

    res.json({
      'message': 'Successfully deleted group message'
    })
  } catch (error) {
    console.error('Internal error:', error);
    await chatsClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.patch('/deleteGroupMessageForAll', async(req, res) => {
  const {
    messageID,
    currentID,
    recipients
  } = req.body;

  try{
    
    recipients.push(currentID);
    const deleteMessageQuery = `
      UPDATE group_messages.messages_history
      SET deleted_list = array_cat(deleted_list, $1)
      WHERE message_id = $2
    `;
    await chatsClient.query(deleteMessageQuery, [recipients, messageID]);

    res.json({
      'message': 'Successfully deleted group message'
    })
  } catch (error) {
    console.error('Internal error:', error);
    await chatsClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.patch('/editGroupProfileData', async(req, res) => {
  const {
    chatID,
    messageID,
    sender,
    recipients,
    newData
  } = req.body;

  try{
    
    var name : String = newData.name;
    var profilePicLink : String = newData.profilePicLink;
    var description : String = newData.description;
    const insertCurrentUserChatQuery = `
      INSERT INTO group_messages.messages_history(
        chat_id, message_id, type, content, sender, upload_time, medias_datas, deleted_list
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    await chatsClient.query(insertCurrentUserChatQuery, [
      chatID, messageID, 'edit_group_profile', '', sender, new Date().toISOString(), '[]', 
      []
    ]);

    const updateGroupProfileDataQuery = `
      UPDATE group_profile.group_info
      SET name = $2, profile_pic_link = $3, description = $4
      WHERE chat_id = $1
    `;
    await chatsClient.query(updateGroupProfileDataQuery, [
      chatID, name, profilePicLink, description
    ]);

    for(var i = 0; i < recipients.length; i++){
      var recipient = recipients[i];
      const updateRecipientUserChatTableQuery = `
        UPDATE users_chats.chats_history
        SET deleted = $1
        WHERE user_id = $2 AND chat_id = $3
      `;
      await chatsClient.query(updateRecipientUserChatTableQuery, [false, recipient, chatID]);
    }

    res.json({
      'message': 'Successfully edited group profile data'
    })
  } catch (error) {
    console.error('Internal error:', error);
    await chatsClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.patch('/leaveGroup', async(req, res) => {
  const {
    chatID,
    messageID,
    sender,
    recipients,
  } = req.body;

  try{
    

    const insertCurrentUserChatQuery = `
      INSERT INTO group_messages.messages_history(
        chat_id, message_id, type, content, sender, upload_time, medias_datas, deleted_list
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    await chatsClient.query(insertCurrentUserChatQuery, [
      chatID, messageID, 'leave_group', '', sender, new Date().toISOString(), '[]', 
      []
    ]);

    const removeSenderFromChatMembersQuery = `
      UPDATE group_profile.group_info 
      SET members = array_remove(members, $1)
      WHERE chat_id = $2
    `;
    await chatsClient.query(removeSenderFromChatMembersQuery, [sender, chatID]);

    const removeChatFromSenderQuery = `
      DELETE FROM users_chats.chats_history WHERE user_id = $1 AND chat_id = $2
    `;
    await chatsClient.query(removeChatFromSenderQuery, [
      sender, chatID
    ]);

    for(var i = 0; i < recipients.length; i++){
      var recipient = recipients[i];
      const updateRecipientUserChatTableQuery = `
        UPDATE users_chats.chats_history
        SET deleted = $1
        WHERE user_id = $2 AND chat_id = $3
      `;
      await chatsClient.query(updateRecipientUserChatTableQuery, [false, recipient, chatID]);
    }

    res.json({
      'message': 'Successfully left group'
    })
  } catch (error) {
    console.error('Internal error:', error);
    await chatsClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchSearchedAddToGroupUsers', async (req, res) => {
  const {
    searchedText,
    recipients,
    currentID,
    currentLength,
    paginationLimit
  } = req.body;
  
  try{
    const fetchSearchedUsersDataQuery = `SELECT user_id FROM public."fetch_searched_add_to_group_users" ($1, $2, $3, $4, $5)`;
    const fetchSearchedUsersData = await profilesClient.query(fetchSearchedUsersDataQuery, [
      searchedText, currentID, recipients, currentLength, paginationLimit
    ]);
    var searchedUsersData : String[] = fetchSearchedUsersData.rows.map((e) => e.user_id);    
    var getCompleteUsersData = await getUsersListBasicData(searchedUsersData, currentID);
    const usersProfileData = getCompleteUsersData.usersProfileData.map((e) => e.data.basic_data);
    
    
    res.json({
      'message': "Successfully fetched data",
      'usersProfileData': usersProfileData,
    })
  } catch (error) {
    console.error('Error fetching user data:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.patch('/addUsersToGroup', async(req, res) => { 
  const {
    chatID,
    messagesID,
    sender,
    recipients,
    addedUsersID
  } = req.body;

  try{
    
    const deleteAllMessageQuery = `
      UPDATE group_messages.messages_history
      SET deleted_list = array_cat(deleted_list, $1)
      WHERE chat_id = $2
    `;
    await chatsClient.query(deleteAllMessageQuery, [addedUsersID, chatID]);
    
    var typesArr = addedUsersID.map((e : String) => `add_users_to_group_${e}`);
    
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
    await chatsClient.query(insertCurrentUserChatQuery, [
      chatID, '', sender, new Date().toISOString(), '[]', 
      [], messagesID, typesArr
    ]);

    const removeSenderFromChatMembersQuery = `
      UPDATE group_profile.group_info 
      SET members = array_cat(members, $1)
      WHERE chat_id = $2
    `;
    await chatsClient.query(removeSenderFromChatMembersQuery, [addedUsersID, chatID]);


    for(var i = 0; i < recipients.length; i++){
      var recipient = recipients[i];
      const updateRecipientUserChatTableQuery = `
        UPDATE users_chats.chats_history
        SET deleted = $1
        WHERE user_id = $2 AND chat_id = $3
      `;
      await chatsClient.query(updateRecipientUserChatTableQuery, [false, recipient, chatID]);
    }

    for(var i = 0; i < addedUsersID.length; i++){
      var userID = addedUsersID[i];
      const insertRecipientUserChatTableQuery = `
        INSERT INTO users_chats.chats_history(
          user_id, chat_id, type, recipient, deleted
        )
        VALUES ($1, $2, $3, $4, $5)
      `;
      await chatsClient.query(insertRecipientUserChatTableQuery, [userID, chatID, 'group', '', false]);
    }

    res.json({
      'message': 'Successfully left group'
    })
  } catch (error) {
    console.error('Internal error:', error);
    await chatsClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.get('/fetchGroupMembersData', async(req, res) => {
  var { 
    usersID,
    currentID,
    currentLength,
    paginationLimit,
    maxFetchLimit
  } = req.body;
  
  try {    
    usersID = usersID.slice(
      currentLength,
      Math.max(0, Math.min(maxFetchLimit - currentLength, paginationLimit))
    );
    
    var getCompleteUsersData = await getUsersListFilteredData(usersID, currentID);
    const usersProfileData = getCompleteUsersData.usersProfileData;
    const usersSocialsData = getCompleteUsersData.usersSocialsData;

    res.json({
      message: "Successfully fetched data", usersProfileData: usersProfileData, 
      usersSocialsData: usersSocialsData
    });
  } catch (error) {
    console.error('Error during fetching user followers:', error);
    res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.patch('/editPost', async (req, res) => {
  const { 
    postId,
    content,
    sender,
    mediasDatas,
    hashtags,
    taggedUsers,
  } = req.body;
  

  try {

    const fetchPostDataQuery = `
      SELECT * FROM posts_list.posts_data WHERE post_id = $1 AND sender = $2
    `;
    var fetchPostData = await postsClient.query(fetchPostDataQuery, [postId, sender]);
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
    
    if(!postData.deleted){
      try {
        await postsClient.query('BEGIN');
        await postsClient.query(insertPostDataQuery, [
          content,
          JSON.stringify(mediasDatas),
          postId,
          sender
        ]);
        await postsClient.query('COMMIT');

        await activitiesLogsClient.query('BEGIN');
        for(var i = 0; i < taggedUsers.length; i++){
          var taggedUser = taggedUsers[i];
          if(taggedUser != sender){
            if(await userExists(taggedUser) && !await isBlockedByUser(taggedUser, sender) && !await userIsPrivateAndNotFollowedByCurrentID(taggedUser, sender)){
              const insertTaggedUserNotificationDataQuery = `
                INSERT INTO notifications_data.notifications_history (
                  type, sender, recipient, referenced_post_id, referenced_post_type, notified_time
                )
                VALUES ($1, $2, $3, $4, $5, $6)
              `;
              await activitiesLogsClient.query(insertTaggedUserNotificationDataQuery, [
                'tagged', sender, taggedUser, postId, 'post', new Date().toISOString()
              ])
            }
          }
        }
        await activitiesLogsClient.query('COMMIT');

        await keywordsClient.query('BEGIN');
        for(var i = 0; i < hashtags.length; i++){
          var hashtag = hashtags[i];
          await keywordsClient.query(insertUpdateHashtagQuery, [
            hashtag, 1
          ]);
        }
        await keywordsClient.query('COMMIT');

        
        res.json({ message: 'Successfully edited the post'});
        
      } catch (error) {
        // Rollback the transaction if any error occurs
        await postsClient.query('ROLLBACK');
      
        console.error('Error uploading post:', error);
      
        // Send an error response to the postsClient
        res.json({ message: 'Server error' });
      }  
    }  
    
  } catch (error) {
    console.error('Error uploading post:', error);
    await postsClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.patch('/editComment', async (req, res) => {
  const { 
    commentID,
    content,
    sender,
    mediasDatas,
    parentPostSender,
    hashtags,
    taggedUsers
  } = req.body;

  

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
      if(await userExists(parentPostSender) && !await isBlockedByUser(parentPostSender, sender)){
        await postsClient.query('BEGIN');
        await postsClient.query(insertCommentDataQuery, [
          content,
          JSON.stringify(mediasDatas),
          commentID,
          sender
        ]);
        await postsClient.query('COMMIT');

        await activitiesLogsClient.query('BEGIN');

        for(var i = 0; i < taggedUsers.length; i++){
          var taggedUser = taggedUsers[i];
          if(taggedUser != sender){
            if(await userExists(taggedUser) && !await isBlockedByUser(taggedUser, sender) && !await userIsPrivateAndNotFollowedByCurrentID(taggedUser, sender)){
              const insertTaggedUserNotificationDataQuery = `
                INSERT INTO notifications_data.notifications_history (
                  type, sender, recipient, referenced_post_id, referenced_post_type, notified_time
                )
                VALUES ($1, $2, $3, $4, $5, $6)
              `;
              await activitiesLogsClient.query(insertTaggedUserNotificationDataQuery, [
                'tagged', sender, taggedUser, commentID, 'comment', new Date().toISOString()
              ])
            }
          }
        }
        await activitiesLogsClient.query('COMMIT');

        await keywordsClient.query('BEGIN');
        for(var i = 0; i < hashtags.length; i++){
          var hashtag = hashtags[i];
          await keywordsClient.query(insertUpdateHashtagQuery, [
            hashtag, 1
          ]);
        }
        await keywordsClient.query('COMMIT');

        
        res.json({ message: 'Successfully edited the comment'});
      }else{
        res.json({message: 'failed to comment'})
      }
    } catch (error) {
      // Rollback the transaction if any error occurs
      await postsClient.query('ROLLBACK');
    
      console.error('Error uploading comment:', error);
    
      // Send an error response to the postsClient
      res.json({ message: 'Server error' });
    }    
    
  } catch (error) {
    console.error('Error uploading post:', error);
    await postsClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }
});

usersRoutes.patch('/deleteAccount', async (req, res) => {
  const { 
    currentID
  } = req.body;

  try{
    const insertUserDeletedQuery = `
      UPDATE basic_data.user_profile
      SET deleted = $2
      WHERE user_id = $1
    `;

    try{
      await profilesClient.query('BEGIN');
      await profilesClient.query(insertUserDeletedQuery, [
        currentID, true
      ]);
      await profilesClient.query('COMMIT');

      
      res.json({message: 'Successfully deleted user'});
    } catch (error) {
      // Rollback the transaction if any error occurs
      await profilesClient.query('ROLLBACK');
    
      console.error('Error deleting user:', error);
    
      // Send an error response to the profilesClient
      res.json({ message: 'Server error' });
    }   
  } catch (error) {
    console.error('Error deleting user:', error);
    await profilesClient.query('ROLLBACK');
    return res.json({ message: 'Internal Server Error' });
  }

});

const postsSchemasList = [
  'likes_list', 'bookmarks_list','posts_comments_data',
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

usersRoutes.delete('/hardDeleteAccount', async (req, res) => {
  const {
    currentID
  } = req.body;

  const getAllPostsQuery = `SELECT * FROM posts_list.posts_data WHERE sender = $1`;
  const getAllPosts = await postsClient.query(getAllPostsQuery, [currentID]);
  const allPosts = getAllPosts.rows;

  const getAllCommentsQuery = `SELECT * FROM comments_list.comments_data WHERE sender = $1`;
  const getAllComments = await postsClient.query(getAllCommentsQuery, [currentID]);
  const allComments = getAllComments.rows;

  

  for(var i = 0; i < allPosts.length; i++){
    if(allPosts[i].type == 'post'){
      var postData = allPosts[i];
      var postID = postData.post_id;
      for(var j = 0; j < postsSchemasList.length; j++){
        const deleteEngagementsDataQuery = `
          DROP TABLE IF EXISTS "${postsSchemasList[j]}"."${postID}";
        `
        await postsClient.query(deleteEngagementsDataQuery, []);
      }
    }else{
      var commentData = allComments[i];
      var commentID = commentData.comment_id;
      for(var j = 0; j < commentsSchemasList.length; j++){
        const deleteEngagementsDataQuery = `
          DROP TABLE IF EXISTS "${commentsSchemasList[j]}"."${commentID}";
        `
        await postsClient.query(deleteEngagementsDataQuery, []);
      }
    }
  }

  

  for(var i = 0; i < allComments.length; i++){
    var commentData = allComments[i];
    var commentID = commentData.comment_id;
    for(var j = 0; j < commentsSchemasList.length; j++){
      const deleteEngagementsDataQuery = `
        DROP TABLE IF EXISTS "${commentsSchemasList[j]}"."${commentID}";
      `
      await postsClient.query(deleteEngagementsDataQuery, []);
    }
  }

  

  const deletePostsSchemaQuery = `
    DROP SCHEMA IF EXISTS "${currentID}" CASCADE;
  `;

  await postsClient.query(deletePostsSchemaQuery, []);

  

  for(var i = 0; i < usersSchemasList.length; i++){
    const deleteUsersDataQuery = `
      DROP TABLE IF EXISTS "${usersSchemasList[i]}"."${currentID}";
    `
    await profilesClient.query(deleteUsersDataQuery, []);
  }

  for(var i = 0; i < notificationsSchemasList.length; i++){
    const deleteActivitiesLogsDataQuery = `
      DROP TABLE IF EXISTS "${notificationsSchemasList[i]}"."${currentID}";
    `
    await activitiesLogsClient.query(deleteActivitiesLogsDataQuery, []);
  }

  

  const deleteUsersDataQuery = `
    DELETE FROM basic_data.user_profile WHERE user_id = $1;
  `;

  await profilesClient.query(deleteUsersDataQuery, [currentID]);

  

  const deleteUsersPasswordQuery = `
    DELETE FROM sensitive_data.user_password WHERE user_id = $1;
  `;

  await profilesClient.query(deleteUsersPasswordQuery, [currentID]);

  res.json({
    'message': 'Successfully deleted account'
  });
   
});

export default usersRoutes;


