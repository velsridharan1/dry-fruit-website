# import packages
from google.cloud import storage
import os

# set key credentials file path
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = 'C:\\Users\\Dell\\Downloads\\calcium-hope-460307-p3-93fc72b9a522.json'

# define function that downloads a file from the bucket
def download_cs_file(bucket_name, file_name, destination_file_name): 
    storage_client = storage.Client()

    bucket = storage_client.bucket(bucket_name)

    blob = bucket.blob(file_name)
    blob.download_to_filename(destination_file_name)

    return True

#create code to download a folder from the bucket
def download_folder(bucket_name, folder_name, destination_folder):
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)

    blobs = bucket.list_blobs(prefix=folder_name)
    
    for blob in blobs:
        # Create the local file path
        local_file_path = os.path.join(destination_folder, blob.name[len(folder_name):])
        os.makedirs(os.path.dirname(local_file_path), exist_ok=True)
        
        # Download the blob to the local file
        blob.download_to_filename(local_file_path)

    return True

#download_cs_file('fourfriends', 'src/index.html', 'C:\\Users\\Dell\\webproject\\index.html')
download_folder('fourfriends', 'src/', 'C:\\Users\\Dell\\webproject')