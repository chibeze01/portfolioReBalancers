from flask import Flask, request, jsonify
from pydantic import BaseModel, Field
from typing import Annotated
from flask_pydantic_spec import FlaskPydanticSpec, Response, Request


class Profile(BaseModel):
    name: Annotated[str, Field(min_length=2, max_length=40)]
    age: int = Field(
        ...,
        gt=0,
        lt=150,
        description='user age(Human)'
    )

    class Config:
        schema_extra = {
            # provide an example
            'example': {
                'name': 'very_important_user',
                'age': 42,
            }
        }


class Message(BaseModel):
    text: str


app = Flask(__name__)
api = FlaskPydanticSpec('flask')

@app.route('/')
@api.validate(resp=Response(HTTP_200=Message))
def index():
    """
    Home route to verify API is running.
    ---
    responses:
      200:
        description: API is running
        content:
          application/json:
            schema: Message
    """
    return jsonify(text='Portfolio Balancer API is running!')

@app.route('/api/user', methods=['POST'])
@api.validate(body=Request(Profile), resp=Response(HTTP_200=Message, HTTP_403=None), tags=['api'])
def user_profile():
    """
    verify user profile (summary of this endpoint)

    user's name, user's age, ... (long description)
    """
    print(request.context.json) # or `request.json`
    return jsonify(text='it works')


if __name__ == "__main__":
    api.register(app) # if you don't register in api init step
    app.run(port=8000)