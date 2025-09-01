# import packages
from google.cloud import storage
import os

# set key credentials file path
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = 'C:\\Users\\Dell\\Downloads\\calcium-hope-460307-p3-93fc72b9a522.json'

# define function that uploads a file from the bucket
def upload_cs_file(bucket_name, source_file_name, destination_file_name): 
    storage_client = storage.Client()

    bucket = storage_client.bucket(bucket_name)

    blob = bucket.blob(destination_file_name)
    blob.upload_from_filename(source_file_name)

    return True
# create code to upload a folder to the bucket
def upload_folder(bucket_name, source_folder, destination_folder):
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)

    for root, dirs, files in os.walk(source_folder):
        for file in files:
            local_file_path = os.path.join(root, file)
            relative_path = os.path.relpath(local_file_path, source_folder)
            blob_path = os.path.join(destination_folder, relative_path)

            blob = bucket.blob(blob_path)
            blob.upload_from_filename(local_file_path)

    return True

#upload_cs_file('test_demo_storage_bucket', 'D:/VSCode/GitRepos/PythonHacks/GCP_Storage_Bucket_Handling_With_Python/cloudquicklabs-93d1e8c6ac6a.json', 'json/test.json')
upload_folder('fourfriends',  'C:\\Users\\Dell\\webproject' ,'src/')
upload_folder('fourfriends',  'C:\\Users\\Dell\\webproject\\assets' ,'src/assets')
upload_folder('fourfriends',  'C:\\Users\\Dell\\webproject\\css' ,'src/css')
upload_folder('fourfriends',  'C:\\Users\\Dell\\webproject\\js' ,'src/js')