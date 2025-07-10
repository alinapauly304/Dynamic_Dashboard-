
import os
import logging
from datetime import datetime, timedelta
from app.utils.config_reader import config

# Get logging settings from ini
conf = config["logging"]

class LoggerSetup:
    @staticmethod
    def setup_logger(name: str, log_dir: str) -> logging.Logger:
        os.makedirs(log_dir, exist_ok=True)

        LoggerSetup._delete_old_logs(log_dir, int(conf['retention']))

        logger = logging.getLogger(name)
        logger.setLevel(logging.DEBUG)

        log_file = os.path.join(log_dir, datetime.now().strftime(f'{name}_%d%m%Y.log'))

        file_handler = logging.FileHandler(log_file)
        formatter = logging.Formatter(
            '[%(levelname)s] :: %(asctime)s  :: %(module)s  :: %(funcName)s '
            ':: %(lineno)d  :: %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

        return logger

    @staticmethod
    def _delete_old_logs(log_dir: str, retention_days: int):
        current_time = datetime.now()
        retention_period = timedelta(days=retention_days)

        for filename in os.listdir(log_dir):
            file_path = os.path.join(log_dir, filename)
            if os.path.isfile(file_path):
                file_creation_time = datetime.fromtimestamp(os.path.getmtime(file_path))
                if current_time - file_creation_time > retention_period:
                    try:
                        os.remove(file_path)
                        print(f"Deleted old log file: {file_path}")
                    except OSError as e:
                        print(f"Error deleting file {file_path}: {e}")


