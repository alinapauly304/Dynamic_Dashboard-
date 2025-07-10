
import configparser
import os

def read_config(file_name):
    """Function to read Config"""
    config = configparser.ConfigParser()
    config._interpolation = configparser.ExtendedInterpolation()
    config.read(file_name)
    filesection = config.sections()
    details = {}
    for section in filesection:
        details_dict = dict(config.items(section))
        
        details[section.lower()] = details_dict
    return details

CFG_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "configurations", "config.ini"
)
config = read_config(CFG_PATH)